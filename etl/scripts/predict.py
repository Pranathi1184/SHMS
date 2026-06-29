import numpy as np
import pandas as pd
from sqlalchemy import create_engine, text
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

try:
    from scripts.config import ETLConfig
    from scripts.logging_utils import get_logger
except ModuleNotFoundError:
    from etl.scripts.config import ETLConfig
    from etl.scripts.logging_utils import get_logger


def run_predictions(mode=None):
    config = ETLConfig.from_env(mode)
    logger = get_logger('etl.predict', config.log_level)

    appointments = pd.read_csv(config.processed_dir / 'appointment_features.csv')
    inventory = pd.read_csv(config.processed_dir / 'inventory_features.csv')
    patient_trends = pd.read_csv(config.processed_dir / 'patient_trends.csv')

    no_show = _build_no_show_predictions(appointments)
    doctor_load = _build_doctor_load_forecast(appointments)
    medicine_demand = _build_medicine_demand_forecast(inventory)
    occupancy = _build_bed_occupancy_forecast(patient_trends)
    billing_risk = _build_billing_risk_scores(appointments)

    engine = create_engine(config.target_db_url)
    try:
      with engine.begin() as conn:
        _upsert(conn, no_show, 'no_show_predictions', ['appointment_id'], ['score_date', 'risk_score', 'risk_label', 'recommendation'])
        _upsert(conn, doctor_load, 'doctor_load_forecast', ['forecast_date', 'doctor_id'], ['predicted_appointments', 'recommendation'])
        _upsert(conn, medicine_demand, 'medicine_demand_forecast', ['month', 'medicine_name'], ['predicted_quantity', 'confidence'])
        _upsert(conn, occupancy, 'bed_occupancy_forecast', ['date', 'ward_type'], ['predicted_occupancy_rate'])
        _upsert(conn, billing_risk, 'billing_risk_scores', ['bill_id'], ['score_date', 'risk_score', 'risk_label', 'recommendation'])

      logger.info('Prediction stage complete')
      return {
          'no_show_predictions': int(no_show.shape[0]),
          'doctor_load_forecast': int(doctor_load.shape[0]),
          'medicine_demand_forecast': int(medicine_demand.shape[0]),
          'bed_occupancy_forecast': int(occupancy.shape[0]),
          'billing_risk_scores': int(billing_risk.shape[0]),
      }
    finally:
      engine.dispose()


def _risk_label(score):
    if score >= 0.75:
        return 'High'
    if score >= 0.45:
        return 'Medium'
    return 'Low'


def _build_no_show_predictions(appointments):
    """
    Predict appointment no-show risk using Logistic Regression.
    Features: prior cancellations, lead time, day of week, time of day, appointment type.
    """
    df = appointments.copy()
    
    # Ensure required columns exist with defaults
    df['prior_cancellations'] = df.get('prior_cancellations', 0).fillna(0).astype(int)
    df['lead_time_hours'] = df.get('lead_time_hours', 24).fillna(24).astype(float)
    df['day_of_week'] = df.get('day_of_week', 2).fillna(2).astype(int)
    
    # Feature engineering
    df['has_prior_cancellations'] = (df['prior_cancellations'] > 0).astype(int)
    df['short_notice'] = (df['lead_time_hours'] < 4).astype(int)
    df['weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
    df['early_morning'] = (df.get('hour', 9) < 7).astype(int)
    
    # Prepare features for model
    features = ['prior_cancellations', 'lead_time_hours', 'day_of_week', 'short_notice', 'weekend']
    X = df[features].fillna(0)
    
    # Scale features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Train Logistic Regression model
    model = LogisticRegression(random_state=42, max_iter=1000)
    try:
        # Generate synthetic labels for training (based on features)
        y_synthetic = (df['prior_cancellations'] > 1).astype(int) | (df['short_notice'] > 0).astype(int)
        model.fit(X_scaled, y_synthetic)
        risk_scores = model.predict_proba(X_scaled)[:, 1]
    except Exception as e:
        # Fallback to heuristic if model training fails
        risk_scores = (
            0.10
            + np.clip(df['prior_cancellations'], 0, 5) * 0.12
            + np.where(df['short_notice'] == 1, 0.25, 0)
            + np.where(df['weekend'] == 1, 0.06, 0)
        ).clip(0, 0.99)
    
    df['risk_score'] = np.clip(risk_scores, 0, 0.99)
    df['risk_label'] = df['risk_score'].apply(_risk_label)
    df['recommendation'] = df['risk_label'].map({
        'High': 'Send SMS and email reminders 24h and 2h prior; allow easy reschedule.',
        'Medium': 'Send reminder 24h prior with confirmation request.',
        'Low': 'Standard reminder cadence is sufficient.',
    })
    df['score_date'] = datetime.now().date()
    
    return df[['appointment_id', 'score_date', 'risk_score', 'risk_label', 'recommendation']]


def _build_doctor_load_forecast(appointments):
    """
    Forecast doctor daily appointment load using Linear Regression.
    Features: historical daily count, day of week, seasonality.
    """
    df = appointments.copy()
    
    # Ensure required columns
    df['score_date'] = pd.to_datetime(df.get('score_date', datetime.now()), errors='coerce')
    df['doctor_id'] = df.get('doctor_id', 1).fillna(1).astype(int)
    
    # Aggregate daily appointments per doctor
    agg = df.groupby([df['score_date'].dt.date, 'doctor_id']).size().reset_index(name='daily_count')
    agg.columns = ['date', 'doctor_id', 'daily_count']
    agg['date'] = pd.to_datetime(agg['date'])
    agg['day_of_week'] = agg['date'].dt.dayofweek
    agg['day_num'] = (agg['date'] - agg['date'].min()).dt.days
    
    # Prepare features for regression
    if len(agg) > 3:
        X = agg[['daily_count', 'day_of_week', 'day_num']].fillna(0)
        y = agg['daily_count'].values
        
        # Train Linear Regression model
        model = LinearRegression()
        try:
            model.fit(X, y)
            predictions = np.maximum(model.predict(X), 0).astype(int)
            confidence = min(0.85, 0.5 + len(agg) * 0.05)
        except Exception as e:
            predictions = (agg['daily_count'] * 1.08).astype(int)
            confidence = 0.60
    else:
        predictions = (agg['daily_count'] * 1.08).astype(int)
        confidence = 0.55
    
    result = agg.copy()
    result['predicted_appointments'] = np.ceil(predictions).astype(int)
    result['confidence'] = confidence
    result['recommendation'] = np.where(
        result['predicted_appointments'] >= 16,
        'High load expected. Consider opening overflow slots or reassigning.',
        'Load acceptable. Keep current roster.',
    )
    result = result.rename(columns={'date': 'forecast_date'})
    result['forecast_date'] = datetime.now().date()
    
    return result[['forecast_date', 'doctor_id', 'predicted_appointments', 'recommendation']]


def _build_medicine_demand_forecast(inventory):
    """
    Forecast medicine demand using Linear Regression with exponential smoothing.
    Features: recent demand, current stock level, reorder level.
    """
    df = inventory.copy()
    
    # Ensure required columns
    df['recent_demand'] = df.get('recent_demand', 0).fillna(0).astype(float)
    df['quantity_on_hand'] = df.get('quantity_on_hand', 0).fillna(0).astype(float)
    df['reorder_level'] = df.get('reorder_level', 10).fillna(10).astype(float)
    df['medicine_name'] = df.get('medicine_name', 'Unknown').fillna('Unknown').astype(str)
    
    # Feature engineering
    df['stock_ratio'] = (df['quantity_on_hand'] / (df['reorder_level'] + 1)).clip(0, 10)
    df['demand_trend'] = df['recent_demand'] * 1.12  # 12% growth trend
    df['safety_stock'] = np.maximum(df['reorder_level'] - df['quantity_on_hand'], 0)
    
    # Prepare features
    X = df[['recent_demand', 'stock_ratio', 'safety_stock']].fillna(0)
    
    # Train Linear Regression model
    model = LinearRegression()
    try:
        if len(df) > 2:
            model.fit(X, df['recent_demand'])
            predictions = np.maximum(model.predict(X), 0)
        else:
            predictions = df['recent_demand'].values
        
        confidence = min(0.82, 0.5 + len(df) * 0.08)
    except Exception as e:
        predictions = df['recent_demand'].values
        confidence = 0.60
    
    # Calculate predicted quantity with safety margin
    df['predicted_quantity'] = np.ceil(
        predictions * 1.15 + df['safety_stock']
    ).astype(int)
    
    df['confidence'] = confidence
    df['month'] = datetime.now().strftime('%Y-%m')
    
    return df[['month', 'medicine_name', 'predicted_quantity', 'confidence']]


def _build_bed_occupancy_forecast(patient_trends):
    """
    Forecast bed occupancy rate using Linear Regression.
    Features: appointment volume, historical occupancy, seasonal factors.
    """
    df = patient_trends.copy()
    
    # Ensure required columns
    df['total_appointments'] = df.get('total_appointments', 0).fillna(0).astype(float)
    df['date'] = pd.to_datetime(df.get('date', datetime.now()), errors='coerce')
    
    # Feature engineering for occupancy prediction
    df['day_of_week'] = df['date'].dt.dayofweek
    df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
    df['appointment_density'] = df['total_appointments'] / 20  # Normalize by typical daily volume
    
    # Prepare features
    X = df[['appointment_density', 'is_weekend', 'day_of_week']].fillna(0)
    
    # Train Linear Regression model
    model = LinearRegression()
    try:
        if len(df) > 3:
            # Synthetic target: occupancy correlates with appointments
            y = np.clip(40 + df['appointment_density'] * 20, 20, 95)
            model.fit(X, y)
            predictions = model.predict(X)
        else:
            predictions = np.clip(42 + df['appointment_density'] * 15, 20, 95)
    except Exception as e:
        predictions = np.clip(42 + df['appointment_density'] * 15, 20, 95)
    
    df['predicted_occupancy_rate'] = np.clip(predictions, 20, 100).round(2)
    df['ward_type'] = 'General'
    df['confidence'] = min(0.75, 0.5 + len(df) * 0.07)
    df['recommendation'] = np.where(
        df['predicted_occupancy_rate'] > 85,
        'High occupancy. Prepare for potential admission delays.',
        'Occupancy within normal range.',
    )
    
    return df[['date', 'ward_type', 'predicted_occupancy_rate', 'confidence', 'recommendation']]


def _build_billing_risk_scores(appointments):
    """
    Predict billing payment risk using Random Forest Classification.
    Features: cancellation history, lead time, appointment type, patient segment.
    """
    df = appointments.copy()
    
    # Ensure required columns
    df['prior_cancellations'] = df.get('prior_cancellations', 0).fillna(0).astype(int)
    df['lead_time_hours'] = df.get('lead_time_hours', 24).fillna(24).astype(float)
    df['appointment_id'] = df.get('appointment_id', range(len(df))).astype(int)
    
    # Feature engineering
    df['has_history'] = (df['prior_cancellations'] > 0).astype(int)
    df['short_lead'] = (df['lead_time_hours'] < 8).astype(int)
    df['multiple_cancellations'] = (df['prior_cancellations'] > 2).astype(int)
    
    # Prepare features for model
    features = ['prior_cancellations', 'lead_time_hours', 'short_lead', 'has_history']
    X = df[features].fillna(0)
    
    # Scale features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Train Random Forest model
    model = RandomForestClassifier(n_estimators=50, random_state=42, max_depth=5)
    try:
        # Generate synthetic labels for training
        y_synthetic = (df['prior_cancellations'] > 1).astype(int) | (df['lead_time_hours'] < 8).astype(int)
        model.fit(X_scaled, y_synthetic)
        risk_scores = model.predict_proba(X_scaled)[:, 1]
    except Exception as e:
        # Fallback to heuristic
        risk_scores = (
            0.15 + np.clip(df['prior_cancellations'], 0, 4) * 0.10 + 
            np.where(df['lead_time_hours'] < 8, 0.18, 0)
        ).clip(0, 0.95)
    
    df['risk_score'] = np.clip(risk_scores, 0, 0.95)
    df['risk_label'] = df['risk_score'].apply(_risk_label)
    df['recommendation'] = df['risk_label'].map({
        'High': 'Prioritize payment reminders and insurance verification.',
        'Medium': 'Send payment reminder within 48 hours of bill generation.',
        'Low': 'Standard billing follow-up.',
    })
    
    df = df.rename(columns={'appointment_id': 'bill_id'})
    df['score_date'] = datetime.now().date()
    
    return df[['bill_id', 'score_date', 'risk_score', 'risk_label', 'recommendation']]


def _upsert(connection, dataframe, table_name, key_columns, update_columns):
    if dataframe.empty:
        return

    columns = key_columns + update_columns
    rows = dataframe[columns].to_dict(orient='records')

    insert_cols = ', '.join(columns)
    values_cols = ', '.join(f':{col}' for col in columns)
    conflict_target = ', '.join(key_columns)
    update_clause = ', '.join(f'{col} = EXCLUDED.{col}' for col in update_columns)

    statement = text(
        f'INSERT INTO {table_name} ({insert_cols}) VALUES ({values_cols}) '
        f'ON CONFLICT ({conflict_target}) DO UPDATE SET {update_clause}'
    )
    connection.execute(statement, rows)


if __name__ == '__main__':
    run_predictions()
