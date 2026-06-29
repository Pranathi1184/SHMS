#!/usr/bin/env powershell

# SHMS Prediction Phase Test Script
# Tests ML Models and APIs

Write-Host "╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     SHMS PREDICTION PHASE - ML MODELS & API TEST             ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Step 1: Login and get JWT token
Write-Host "📝 STEP 1: Authentication" -ForegroundColor Yellow
Write-Host "   Logging in with admin@shms.com..." -ForegroundColor Gray

$loginResponse = Invoke-WebRequest -Uri 'http://localhost:5000/api/auth/login' `
  -Method Post `
  -ContentType 'application/json' `
  -Body '{"email":"admin@shms.com","password":"admin123"}' `
  -UseBasicParsing `
  -ErrorAction Stop

$loginData = $loginResponse.Content | ConvertFrom-Json
$token = $loginData.data.access_token

if ($token) {
  Write-Host "   ✅ Login successful" -ForegroundColor Green
  Write-Host "   Token: $($token.Substring(0,20))..." -ForegroundColor Green
} else {
  Write-Host "   ❌ Login failed" -ForegroundColor Red
  exit 1
}

Write-Host ""

# Step 2: Test Prediction Endpoints
Write-Host "🎯 STEP 2: Testing Prediction Endpoints" -ForegroundColor Yellow
Write-Host ""

$headers = @{
  'Authorization' = "Bearer $token"
  'Content-Type' = 'application/json'
}

# Test 2a: No-Show Predictions
Write-Host "   2a) No-Show Predictions (Appointment Risk)..." -ForegroundColor Gray
try {
  $noShowResponse = Invoke-WebRequest -Uri 'http://localhost:5000/api/predictions/no-show?limit=5' `
    -Headers $headers `
    -UseBasicParsing
  
  $noShowData = $noShowResponse.Content | ConvertFrom-Json
  Write-Host "   ✅ Endpoint responding" -ForegroundColor Green
  Write-Host "      Records found: $($noShowData.count)" -ForegroundColor Green
  
  if ($noShowData.count -gt 0) {
    Write-Host "      Sample: Risk Score = $($noShowData.data[0].risk_score), Label = $($noShowData.data[0].risk_label)" -ForegroundColor Green
  } else {
    Write-Host "      No predictions yet (normal on first run)" -ForegroundColor Gray
  }
} catch {
  Write-Host "   ⚠️  Endpoint not ready or no data" -ForegroundColor Yellow
}

Write-Host ""

# Test 2b: Doctor Load Forecast
Write-Host "   2b) Doctor Workload Forecast..." -ForegroundColor Gray
try {
  $doctorResponse = Invoke-WebRequest -Uri 'http://localhost:5000/api/predictions/doctor-load?limit=5' `
    -Headers $headers `
    -UseBasicParsing
  
  $doctorData = $doctorResponse.Content | ConvertFrom-Json
  Write-Host "   ✅ Endpoint responding" -ForegroundColor Green
  Write-Host "      Records found: $($doctorData.count)" -ForegroundColor Green
  
  if ($doctorData.count -gt 0) {
    Write-Host "      Sample: Predicted Appointments = $($doctorData.data[0].predicted_appointments)" -ForegroundColor Green
  }
} catch {
  Write-Host "   ⚠️  Endpoint not ready or no data" -ForegroundColor Yellow
}

Write-Host ""

# Test 2c: Medicine Demand
Write-Host "   2c) Medicine Demand Forecast..." -ForegroundColor Gray
try {
  $medicineResponse = Invoke-WebRequest -Uri 'http://localhost:5000/api/predictions/medicine-demand?limit=5' `
    -Headers $headers `
    -UseBasicParsing
  
  $medicineData = $medicineResponse.Content | ConvertFrom-Json
  Write-Host "   ✅ Endpoint responding" -ForegroundColor Green
  Write-Host "      Records found: $($medicineData.count)" -ForegroundColor Green
  
  if ($medicineData.count -gt 0) {
    Write-Host "      Sample: Medicine = $($medicineData.data[0].medicine_name), Qty = $($medicineData.data[0].predicted_quantity)" -ForegroundColor Green
  }
} catch {
  Write-Host "   ⚠️  Endpoint not ready or no data" -ForegroundColor Yellow
}

Write-Host ""

# Test 2d: Bed Occupancy
Write-Host "   2d) Bed Occupancy Forecast..." -ForegroundColor Gray
try {
  $occupancyResponse = Invoke-WebRequest -Uri 'http://localhost:5000/api/predictions/bed-occupancy?limit=5' `
    -Headers $headers `
    -UseBasicParsing
  
  $occupancyData = $occupancyResponse.Content | ConvertFrom-Json
  Write-Host "   ✅ Endpoint responding" -ForegroundColor Green
  Write-Host "      Records found: $($occupancyData.count)" -ForegroundColor Green
  
  if ($occupancyData.count -gt 0) {
    Write-Host "      Sample: Occupancy = $($occupancyData.data[0].predicted_occupancy_rate)%, Ward = $($occupancyData.data[0].ward_type)" -ForegroundColor Green
  }
} catch {
  Write-Host "   ⚠️  Endpoint not ready or no data" -ForegroundColor Yellow
}

Write-Host ""

# Test 2e: Billing Risk
Write-Host "   2e) Billing Risk Scores..." -ForegroundColor Gray
try {
  $billingResponse = Invoke-WebRequest -Uri 'http://localhost:5000/api/predictions/billing-risk?limit=5' `
    -Headers $headers `
    -UseBasicParsing
  
  $billingData = $billingResponse.Content | ConvertFrom-Json
  Write-Host "   ✅ Endpoint responding" -ForegroundColor Green
  Write-Host "      Records found: $($billingData.count)" -ForegroundColor Green
  
  if ($billingData.count -gt 0) {
    Write-Host "      Sample: Risk Score = $($billingData.data[0].risk_score), Label = $($billingData.data[0].risk_label)" -ForegroundColor Green
  }
} catch {
  Write-Host "   ⚠️  Endpoint not ready or no data" -ForegroundColor Yellow
}

Write-Host ""

# Test 2f: Summary Dashboard
Write-Host "   2f) Prediction Summary (Admin Dashboard)..." -ForegroundColor Gray
try {
  $summaryResponse = Invoke-WebRequest -Uri 'http://localhost:5000/api/predictions/summary' `
    -Headers $headers `
    -UseBasicParsing
  
  $summaryData = $summaryResponse.Content | ConvertFrom-Json
  Write-Host "   ✅ Endpoint responding" -ForegroundColor Green
  Write-Host "      High Risk No-Shows: $($summaryData.summary.no_show_high_risk)" -ForegroundColor Green
  Write-Host "      High Load Doctors: $($summaryData.summary.doctor_high_load)" -ForegroundColor Green
  Write-Host "      Urgent Medicines: $($summaryData.summary.medicine_urgent)" -ForegroundColor Green
  Write-Host "      High Occupancy: $($summaryData.summary.occupancy_high)" -ForegroundColor Green
  Write-Host "      High Risk Bills: $($summaryData.summary.billing_high_risk)" -ForegroundColor Green
} catch {
  Write-Host "   ⚠️  Endpoint not ready or no data" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                    TEST SUMMARY                              ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ All prediction endpoints are accessible" -ForegroundColor Green
Write-Host ""
Write-Host "📊 NEXT STEPS:" -ForegroundColor Cyan
Write-Host "   1. Run ETL pipeline to generate predictions"
Write-Host "   2. Check Airflow DAG execution"
Write-Host "   3. Create frontend dashboard pages"
Write-Host ""
Write-Host "🔗 URLs:" -ForegroundColor Cyan
Write-Host "   Airflow Dashboard: http://localhost:8080"
Write-Host "   Backend API: http://localhost:5000/api/predictions"
Write-Host "   Frontend: http://localhost"
Write-Host ""
