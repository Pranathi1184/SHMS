# 🚀 Predict Phase - Deployment & Verification Guide

## What Was Implemented

### ✅ Backend (Node.js/Sequelize)
- 5 Sequelize models for ML predictions
- 1 migration file to create database tables
- 1 controller with 6 API endpoints
- 1 route file with role-based access control
- Routes registered in app.js

### ✅ ETL (Python/Airflow)
- Enhanced predict.py with real ML models
  - Logistic Regression (no-show, billing risk)
  - Linear Regression (doctor load, medicine demand, occupancy)
  - Random Forest (advanced billing risk)
  - StandardScaler for normalization
- Added scikit-learn to requirements.txt
- Fallback heuristics for low-data scenarios

### ✅ Database
- 5 new tables with proper indexes and relationships
- Foreign keys to source data (appointments, doctors, medicines, bills, etc.)
- Timestamps and audit trails

---

## 📋 Files Created/Modified

### Backend
```
✓ backend/src/models/NoShowPrediction.js (NEW)
✓ backend/src/models/DoctorLoadForecast.js (NEW)
✓ backend/src/models/MedicineDemandForecast.js (NEW)
✓ backend/src/models/BedOccupancyForecast.js (NEW)
✓ backend/src/models/BillingRiskScore.js (NEW)
✓ backend/src/models/index.js (MODIFIED - added 5 new models)
✓ backend/src/migrations/create-prediction-tables.js (NEW)
✓ backend/src/controllers/predictionController.js (NEW)
✓ backend/src/routes/predictionRoutes.js (NEW)
✓ backend/src/app.js (MODIFIED - added prediction routes)
```

### ETL
```
✓ etl/scripts/predict.py (ENHANCED with ML models)
✓ etl/requirements.txt (MODIFIED - added scikit-learn)
```

### Documentation
```
✓ PREDICT_PHASE_IMPLEMENTATION.md (COMPREHENSIVE GUIDE)
✓ PREDICT_PHASE_VERIFICATION_GUIDE.md (THIS FILE)
```

---

## 🔧 Deployment Steps

### Step 1: Install Dependencies

```bash
# Backend is already using npm, no changes needed

# ETL Python dependencies
cd etl
pip install -r requirements.txt
# OR in Docker:
docker-compose build etl
```

### Step 2: Run Database Migrations

```bash
# Using Sequelize CLI (in backend directory)
cd backend
npx sequelize db:migrate

# OR using raw SQL (if needed):
psql -h localhost -U postgres -d shms -f src/migrations/create-prediction-tables.sql
```

### Step 3: Verify Tables Created

```bash
# Connect to database
psql -h localhost -U postgres -d shms

# Check tables exist
\dt no_show_predictions
\dt doctor_load_forecasts
\dt medicine_demand_forecasts
\dt bed_occupancy_forecasts
\dt billing_risk_scores

# Check row count (should be 0 initially)
SELECT COUNT(*) FROM no_show_predictions;
SELECT COUNT(*) FROM doctor_load_forecasts;
SELECT COUNT(*) FROM medicine_demand_forecasts;
SELECT COUNT(*) FROM bed_occupancy_forecasts;
SELECT COUNT(*) FROM billing_risk_scores;
```

### Step 4: Restart Backend

```bash
# Docker method (recommended)
docker-compose down
docker-compose up -d backend

# OR local method
cd backend
npm install  # if needed
npm start
```

### Step 5: Test Backend Routes (GET /api/predictions/summary)

```bash
# 1. Get JWT token first
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@shms.com",
    "password": "admin123"
  }'

# Response should include: {"access_token": "eyJhbGci..."}
# Copy the access_token value

# 2. Test predictions endpoint
curl http://localhost:5000/api/predictions/summary \
  -H "Authorization: Bearer {PASTE_ACCESS_TOKEN_HERE}"

# Response (first time will be empty):
# {
#   "success": true,
#   "summary": {
#     "no_show_high_risk": 0,
#     "doctor_high_load": 0,
#     "medicine_urgent": 0,
#     "occupancy_high": 0,
#     "billing_high_risk": 0
#   }
# }
```

### Step 6: Run ETL Pipeline

```bash
# Option A: Trigger via Airflow UI (Recommended)
1. Open http://localhost:8080
2. Login with airflow/airflow
3. Find DAG: "shms_daily_analytics_etl"
4. Click the "Trigger DAG" button
5. Monitor execution (should take ~25 seconds)

# Option B: Command line
docker exec airflow airflow dags trigger shms_daily_analytics_etl

# Option C: Local Python (if running outside Docker)
cd etl
python -m scripts.predict
```

### Step 7: Verify Predictions Generated

```bash
# Check row counts again
psql -h localhost -U postgres -d shms

SELECT COUNT(*) FROM no_show_predictions;
SELECT COUNT(*) FROM doctor_load_forecasts;
SELECT COUNT(*) FROM medicine_demand_forecasts;
SELECT COUNT(*) FROM bed_occupancy_forecasts;
SELECT COUNT(*) FROM billing_risk_scores;

# Should show > 0 rows (depending on seed data)

# Sample query to see data
SELECT * FROM no_show_predictions LIMIT 5;
```

### Step 8: Test All Prediction Endpoints

```bash
# Get token (use step 5)
TOKEN="your_access_token_here"

# Test each endpoint
curl "http://localhost:5000/api/predictions/no-show?riskLabel=High&limit=5" \
  -H "Authorization: Bearer $TOKEN"

curl "http://localhost:5000/api/predictions/doctor-load?limit=10" \
  -H "Authorization: Bearer $TOKEN"

curl "http://localhost:5000/api/predictions/medicine-demand?minConfidence=0.7" \
  -H "Authorization: Bearer $TOKEN"

curl "http://localhost:5000/api/predictions/bed-occupancy" \
  -H "Authorization: Bearer $TOKEN"

curl "http://localhost:5000/api/predictions/billing-risk?riskLabel=High" \
  -H "Authorization: Bearer $TOKEN"

curl "http://localhost:5000/api/predictions/summary" \
  -H "Authorization: Bearer $TOKEN"
```

---

## ✅ Verification Checklist

### Backend Setup
- [ ] Database tables created (5 tables)
- [ ] Sequelize models can be imported
- [ ] Migrations run successfully
- [ ] Tables exist with correct columns
- [ ] Indexes created for performance
- [ ] Foreign keys established

### API Verification
- [ ] GET /api/predictions/no-show returns 200
- [ ] GET /api/predictions/doctor-load returns 200
- [ ] GET /api/predictions/medicine-demand returns 200
- [ ] GET /api/predictions/bed-occupancy returns 200
- [ ] GET /api/predictions/billing-risk returns 200
- [ ] GET /api/predictions/summary returns 200 (Admin only)
- [ ] Role-based access control working
- [ ] Unauthenticated requests return 401

### ETL Verification
- [ ] scikit-learn installed in Python environment
- [ ] predict.py imports successfully
- [ ] Airflow DAG runs without errors
- [ ] All 5 prediction tables populated
- [ ] Predictions have valid scores (0-1 range)
- [ ] Recommendations are present
- [ ] Execution time < 30 seconds

### Data Quality
- [ ] No-show risk scores are between 0-1
- [ ] Doctor load predictions are reasonable (5-20 appointments)
- [ ] Medicine demand matches inventory patterns
- [ ] Bed occupancy between 20-100%
- [ ] Billing risk scores make sense
- [ ] All risk labels are: Low, Medium, or High

---

## 🐛 Troubleshooting

### Issue: "scikit-learn not found"
**Solution:**
```bash
# In ETL container or Python environment
pip install scikit-learn
# Or: pip install scikit-learn==1.5.0
```

### Issue: "Table does not exist" error
**Solution:**
```bash
# Run migrations
cd backend
npx sequelize db:migrate

# Or manually create tables:
psql -h localhost -U postgres -d shms
\i src/migrations/create-prediction-tables.sql
```

### Issue: "prediction routes not found" (404)
**Solution:**
```bash
# Check app.js has this line:
# app.use('/api/predictions', predictionRoutes);

# Restart backend:
docker-compose restart backend

# Test again:
curl http://localhost:5000/api/predictions/summary \
  -H "Authorization: Bearer $TOKEN"
```

### Issue: Empty prediction tables after ETL
**Solution:**
1. Check seed data exists: `SELECT COUNT(*) FROM appointments;`
2. Check ETL logs: `docker logs airflow`
3. Run ETL manually: `python etl/scripts/predict.py`
4. Check for Python errors in ETL logs

### Issue: Predictions have score 0 or 1 only
**Solution:**
- This indicates fallback heuristics are being used (low data scenario)
- Normal during development with limited seed data
- Scores normalize with real operational data

---

## 🎯 Next Steps

### Immediate (Today)
1. Run through deployment steps 1-8
2. Verify all endpoints return 200
3. Check prediction tables have data

### Short Term (This Week)
1. Create frontend pages for each prediction type
2. Display predictions in dashboard
3. Add filters and sorting
4. Show recommendations prominently

### Medium Term (Next Week)
1. Integrate predictions into operational workflows
2. Send notifications based on predictions
3. Track prediction accuracy
4. Monitor model performance

---

## 📊 Example API Responses

### No-Show Prediction
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "id": 1,
      "appointment_id": 42,
      "score_date": "2026-06-29",
      "risk_score": 0.78,
      "risk_label": "High",
      "recommendation": "Send SMS and email reminders 24h and 2h prior; allow easy reschedule.",
      "appointment": {
        "id": 42,
        "appointment_date": "2026-07-05",
        "appointment_time": "14:30",
        "reason": "Annual checkup"
      }
    }
  ]
}
```

### Doctor Load Forecast
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": 1,
      "forecast_date": "2026-06-29",
      "doctor_id": 3,
      "predicted_appointments": 18,
      "recommendation": "High load expected. Consider opening overflow slots or reassigning.",
      "doctor": {
        "id": 3,
        "specialization": "Cardiology",
        "license_number": "MED-2020-0342"
      }
    }
  ]
}
```

### Prediction Summary (Dashboard)
```json
{
  "success": true,
  "summary": {
    "no_show_high_risk": 12,
    "doctor_high_load": 3,
    "medicine_urgent": 18,
    "occupancy_high": 2,
    "billing_high_risk": 47
  }
}
```

---

## 🔗 Related Documentation

- [Predict Phase Implementation Guide](./PREDICT_PHASE_IMPLEMENTATION.md)
- [ETL Pipeline Overview](./ETL_PIPELINE_OVERVIEW.md)
- [API Documentation](./API_DOCUMENTATION.md)
- [Backend Architecture](./BACKEND_ARCHITECTURE.md)

---

**Last Updated:** June 29, 2026  
**Status:** Ready for Testing  
**Next Task:** Frontend Dashboard Implementation
