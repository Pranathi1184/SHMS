-- Analytics Schema for SHMS
-- This schema is used for long-term reporting and trends

CREATE TABLE IF NOT EXISTS daily_revenue (
    id SERIAL PRIMARY KEY,
    date DATE UNIQUE NOT NULL,
    total_revenue DECIMAL(15, 2) DEFAULT 0.00,
    total_bills INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS monthly_revenue (
    id SERIAL PRIMARY KEY,
    month DATE UNIQUE NOT NULL, -- First day of the month
    total_revenue DECIMAL(15, 2) DEFAULT 0.00,
    total_bills INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS patient_trends (
    id SERIAL PRIMARY KEY,
    date DATE UNIQUE NOT NULL,
    new_patients INTEGER DEFAULT 0,
    total_appointments INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS popular_medicines (
    id SERIAL PRIMARY KEY,
    month DATE NOT NULL,
    medicine_name VARCHAR(255) NOT NULL,
    total_quantity_sold INTEGER DEFAULT 0,
    total_revenue DECIMAL(15, 2) DEFAULT 0.00,
    UNIQUE(month, medicine_name),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS average_stay_duration (
    id SERIAL PRIMARY KEY,
    month DATE UNIQUE NOT NULL,
    avg_days_stay DECIMAL(5, 2) DEFAULT 0.00,
    total_discharges INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS appointment_features (
    appointment_id UUID PRIMARY KEY,
    score_date DATE NOT NULL,
    patient_id UUID,
    doctor_id UUID,
    day_of_week INTEGER,
    hour_of_day INTEGER,
    lead_time_hours DECIMAL(10, 2),
    prior_appointments INTEGER DEFAULT 0,
    prior_cancellations INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory_features (
    medicine_id UUID PRIMARY KEY,
    month DATE NOT NULL,
    medicine_name VARCHAR(255),
    quantity_on_hand INTEGER DEFAULT 0,
    reorder_level INTEGER DEFAULT 0,
    recent_demand INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS no_show_predictions (
    appointment_id UUID PRIMARY KEY,
    score_date DATE NOT NULL,
    risk_score DECIMAL(5, 4) NOT NULL,
    risk_label VARCHAR(16) NOT NULL,
    recommendation TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS doctor_load_forecast (
    id SERIAL PRIMARY KEY,
    forecast_date DATE NOT NULL,
    doctor_id UUID NOT NULL,
    predicted_appointments INTEGER DEFAULT 0,
    recommendation TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(forecast_date, doctor_id)
);

CREATE TABLE IF NOT EXISTS medicine_demand_forecast (
    id SERIAL PRIMARY KEY,
    month DATE NOT NULL,
    medicine_name VARCHAR(255) NOT NULL,
    predicted_quantity INTEGER DEFAULT 0,
    confidence DECIMAL(5, 4) DEFAULT 0.50,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(month, medicine_name)
);

CREATE TABLE IF NOT EXISTS bed_occupancy_forecast (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    ward_type VARCHAR(100) NOT NULL,
    predicted_occupancy_rate DECIMAL(6, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date, ward_type)
);

CREATE TABLE IF NOT EXISTS billing_risk_scores (
    bill_id UUID PRIMARY KEY,
    score_date DATE NOT NULL,
    risk_score DECIMAL(5, 4) NOT NULL,
    risk_label VARCHAR(16) NOT NULL,
    recommendation TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
