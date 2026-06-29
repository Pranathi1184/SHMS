from datetime import datetime


REQUIRED_INPUT_FILES = [
    'bills.csv',
    'patients.csv',
    'appointments.csv',
    'prescription_items.csv',
    'medicines.csv',
    'admissions.csv',
]

EXPECTED_SCHEMAS = {
    'daily_revenue.csv': ['date', 'total_revenue', 'total_bills'],
    'patient_trends.csv': ['date', 'new_patients', 'total_appointments'],
    'popular_medicines.csv': ['month', 'medicine_name', 'total_quantity_sold', 'total_revenue'],
    'average_stay_duration.csv': ['month', 'avg_days_stay', 'total_discharges'],
    'appointment_features.csv': [
        'appointment_id',
        'score_date',
        'patient_id',
        'doctor_id',
        'day_of_week',
        'hour_of_day',
        'lead_time_hours',
        'prior_appointments',
        'prior_cancellations',
    ],
    'inventory_features.csv': [
        'medicine_id',
        'month',
        'medicine_name',
        'quantity_on_hand',
        'reorder_level',
        'recent_demand',
    ],
}


def ensure_required_columns(df, required_columns, dataset_name):
    missing = [col for col in required_columns if col not in df.columns]
    if missing:
        raise ValueError(f"Dataset '{dataset_name}' missing required columns: {', '.join(missing)}")


def ensure_expected_output_schema(df, output_name):
    expected = EXPECTED_SCHEMAS[output_name]
    ensure_required_columns(df, expected, output_name)


def parse_timestamp(value):
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        return datetime.fromisoformat(value.replace('Z', '+00:00'))
    raise ValueError(f'Unsupported timestamp value: {value}')
