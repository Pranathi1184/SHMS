from pathlib import Path

import pandas as pd

try:
    from scripts.config import ETLConfig
    from scripts.logging_utils import get_logger
    from scripts.validation import (
        REQUIRED_INPUT_FILES,
        ensure_expected_output_schema,
        ensure_required_columns,
    )
except ModuleNotFoundError:
    from etl.scripts.config import ETLConfig
    from etl.scripts.logging_utils import get_logger
    from etl.scripts.validation import (
        REQUIRED_INPUT_FILES,
        ensure_expected_output_schema,
        ensure_required_columns,
    )


def transform_data(mode=None):
    config = ETLConfig.from_env(mode)
    logger = get_logger('etl.transform', config.log_level)
    config.processed_dir.mkdir(parents=True, exist_ok=True)
    _validate_input_files(config.raw_dir)

    logger.info('Transforming data in mode=%s', config.mode)
    daily_revenue = _build_daily_revenue(config.raw_dir)
    patient_trends = _build_patient_trends(config.raw_dir)
    popular_medicines = _build_popular_medicines(config.raw_dir)
    avg_stay = _build_average_stay(config.raw_dir)
    appointment_features = _build_appointment_features(config.raw_dir)
    inventory_features = _build_inventory_features(config.raw_dir)

    output_map = {
        'daily_revenue.csv': daily_revenue,
        'patient_trends.csv': patient_trends,
        'popular_medicines.csv': popular_medicines,
        'average_stay_duration.csv': avg_stay,
        'appointment_features.csv': appointment_features,
        'inventory_features.csv': inventory_features,
    }

    for file_name, dataframe in output_map.items():
        ensure_expected_output_schema(dataframe, file_name)
        output_path = config.processed_dir / file_name
        dataframe.to_csv(output_path, index=False)
        logger.info('Wrote %s rows to %s', len(dataframe.index), output_path)

    logger.info('Transformation complete.')
    return {name: int(df.shape[0]) for name, df in output_map.items()}


def _to_datetime(series):
    return pd.to_datetime(series, format='mixed', errors='coerce', utc=True)


def _validate_input_files(input_dir):
    missing = [name for name in REQUIRED_INPUT_FILES if not (input_dir / name).exists()]
    if missing:
        raise FileNotFoundError(f"Missing required raw files: {', '.join(missing)}")


def _build_daily_revenue(input_dir):
    bills = pd.read_csv(input_dir / 'bills.csv')
    ensure_required_columns(bills, ['bill_date', 'payment_status', 'net_amount'], 'bills.csv')

    bills['bill_date'] = _to_datetime(bills['bill_date'])
    paid_bills = bills[bills['payment_status'] == 'Paid'].copy()
    result = (
        paid_bills.groupby(paid_bills['bill_date'].dt.date)['net_amount']
        .agg(['sum', 'count'])
        .reset_index()
    )
    result.columns = ['date', 'total_revenue', 'total_bills']
    result['total_revenue'] = result['total_revenue'].astype(float)
    result['total_bills'] = result['total_bills'].astype(int)
    return result


def _build_patient_trends(input_dir):
    patients = pd.read_csv(input_dir / 'patients.csv')
    appointments = pd.read_csv(input_dir / 'appointments.csv')
    ensure_required_columns(patients, ['created_at'], 'patients.csv')
    ensure_required_columns(appointments, ['appointment_date'], 'appointments.csv')

    patients['created_at'] = _to_datetime(patients['created_at'])
    appointments['appointment_date'] = _to_datetime(appointments['appointment_date'])

    new_patients_daily = patients.groupby(patients['created_at'].dt.date).size().reset_index(name='new_patients')
    new_patients_daily.columns = ['date', 'new_patients']

    appointments_daily = (
        appointments.groupby(appointments['appointment_date'].dt.date)
        .size()
        .reset_index(name='total_appointments')
    )
    appointments_daily.columns = ['date', 'total_appointments']

    trends = pd.merge(new_patients_daily, appointments_daily, on='date', how='outer').fillna(0)
    trends['new_patients'] = trends['new_patients'].astype(int)
    trends['total_appointments'] = trends['total_appointments'].astype(int)
    return trends


def _build_popular_medicines(input_dir):
    items = pd.read_csv(input_dir / 'prescription_items.csv')
    medicines = pd.read_csv(input_dir / 'medicines.csv')
    ensure_required_columns(items, ['medicine_id', 'quantity', 'created_at'], 'prescription_items.csv')
    ensure_required_columns(medicines, ['id', 'name'], 'medicines.csv')

    merged = pd.merge(items, medicines, left_on='medicine_id', right_on='id', suffixes=('_item', '_med'))
    created_at_column = 'created_at'
    if created_at_column not in merged.columns:
        for candidate in ['created_at_item', 'created_at_x', 'created_at_med', 'created_at_y']:
            if candidate in merged.columns:
                created_at_column = candidate
                break

    if created_at_column not in merged.columns:
        return pd.DataFrame(columns=['month', 'medicine_name', 'total_quantity_sold', 'total_revenue'])

    merged[created_at_column] = _to_datetime(merged[created_at_column])
    merged['month'] = merged[created_at_column].dt.to_period('M').dt.to_timestamp()

    quantity_column = 'quantity'
    if quantity_column not in merged.columns:
        for candidate in ['quantity_item', 'quantity_x', 'quantity_med', 'quantity_y']:
            if candidate in merged.columns:
                quantity_column = candidate
                break

    if quantity_column not in merged.columns:
        return pd.DataFrame(columns=['month', 'medicine_name', 'total_quantity_sold', 'total_revenue'])

    result = merged.groupby(['month', 'name'], as_index=False)[quantity_column].sum()
    result.columns = ['month', 'medicine_name', 'total_quantity_sold']
    result['total_quantity_sold'] = result['total_quantity_sold'].astype(int)
    # Placeholder revenue is explicitly computed as zero until prescription pricing is integrated.
    result['total_revenue'] = 0.0
    return result


def _build_average_stay(input_dir):
    admissions = pd.read_csv(input_dir / 'admissions.csv')
    ensure_required_columns(admissions, ['admission_date', 'discharge_date'], 'admissions.csv')

    admissions['admission_date'] = _to_datetime(admissions['admission_date'])
    admissions['discharge_date'] = _to_datetime(admissions['discharge_date'])

    discharged = admissions.dropna(subset=['discharge_date']).copy()
    discharged['stay_duration'] = (discharged['discharge_date'] - discharged['admission_date']).dt.days
    discharged['month'] = discharged['discharge_date'].dt.to_period('M').dt.to_timestamp()

    result = discharged.groupby('month')['stay_duration'].agg(['mean', 'count']).reset_index()
    result.columns = ['month', 'avg_days_stay', 'total_discharges']
    result['avg_days_stay'] = result['avg_days_stay'].astype(float)
    result['total_discharges'] = result['total_discharges'].astype(int)
    return result


def _build_appointment_features(input_dir):
    appointments = pd.read_csv(input_dir / 'appointments.csv')
    ensure_required_columns(
        appointments,
        ['id', 'patient_id', 'doctor_id', 'appointment_date', 'start_time', 'created_at', 'status'],
        'appointments.csv',
    )

    appointments['appointment_date'] = _to_datetime(appointments['appointment_date'])
    appointments['created_at'] = _to_datetime(appointments['created_at'])

    appointments['score_date'] = appointments['appointment_date'].dt.date
    appointments['day_of_week'] = appointments['appointment_date'].dt.dayofweek
    appointments['hour_of_day'] = appointments['appointment_date'].dt.hour.fillna(9).astype(int)
    appointments['lead_time_hours'] = (
        (appointments['appointment_date'] - appointments['created_at']).dt.total_seconds() / 3600
    ).fillna(0)

    appointments = appointments.sort_values(['patient_id', 'appointment_date'])
    appointments['prior_appointments'] = appointments.groupby('patient_id').cumcount()
    appointments['prior_cancellations'] = (
        appointments.groupby('patient_id')['status']
        .apply(lambda s: s.eq('Cancelled').shift(1).fillna(False).cumsum())
        .reset_index(level=0, drop=True)
    )

    result = appointments[
        [
            'id',
            'score_date',
            'patient_id',
            'doctor_id',
            'day_of_week',
            'hour_of_day',
            'lead_time_hours',
            'prior_appointments',
            'prior_cancellations',
        ]
    ].rename(columns={'id': 'appointment_id'})

    result['lead_time_hours'] = result['lead_time_hours'].astype(float)
    result['prior_appointments'] = result['prior_appointments'].astype(int)
    result['prior_cancellations'] = result['prior_cancellations'].astype(int)
    return result


def _build_inventory_features(input_dir):
    medicines = pd.read_csv(input_dir / 'medicines.csv')
    items = pd.read_csv(input_dir / 'prescription_items.csv')
    ensure_required_columns(medicines, ['id', 'name', 'quantity', 'reorder_level', 'updated_at'], 'medicines.csv')
    ensure_required_columns(items, ['medicine_id', 'quantity', 'created_at'], 'prescription_items.csv')

    items['created_at'] = _to_datetime(items['created_at'])
    items['month'] = items['created_at'].dt.to_period('M').dt.to_timestamp()
    demand = items.groupby(['medicine_id', 'month'])['quantity'].sum().reset_index(name='recent_demand')

    medicines['updated_at'] = _to_datetime(medicines['updated_at'])
    medicines['month'] = medicines['updated_at'].dt.to_period('M').dt.to_timestamp()

    merged = pd.merge(
        medicines[['id', 'name', 'quantity', 'reorder_level', 'month']],
        demand,
        left_on=['id', 'month'],
        right_on=['medicine_id', 'month'],
        how='left',
    ).fillna({'recent_demand': 0})

    result = merged[
        ['id', 'month', 'name', 'quantity', 'reorder_level', 'recent_demand']
    ].rename(
        columns={
            'id': 'medicine_id',
            'name': 'medicine_name',
            'quantity': 'quantity_on_hand',
        }
    )

    result['quantity_on_hand'] = result['quantity_on_hand'].astype(int)
    result['reorder_level'] = result['reorder_level'].astype(int)
    result['recent_demand'] = result['recent_demand'].astype(int)
    return result


if __name__ == '__main__':
    transform_data()
