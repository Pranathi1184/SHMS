$response = Invoke-WebRequest -Uri 'http://localhost:5000/api/auth/login' `
  -Method Post `
  -ContentType 'application/json' `
  -Body '{"email":"admin@shms.com","password":"admin123"}' `
  -UseBasicParsing

$loginData = $response.Content | ConvertFrom-Json
$token = $loginData.data.access_token

Write-Host "Token retrieved successfully" -ForegroundColor Green
Write-Host "Token: $($token.Substring(0,50))..." -ForegroundColor Cyan
Write-Host ""

# Test prediction endpoints
$headers = @{
  'Authorization' = "Bearer $token"
}

Write-Host "Testing Prediction Endpoints..." -ForegroundColor Yellow
Write-Host ""

# No-Show Predictions
Write-Host "1. No-Show Predictions:" -ForegroundColor Cyan
try {
  $noShow = Invoke-WebRequest -Uri 'http://localhost:5000/api/predictions/no-show?limit=5' `
    -Headers $headers `
    -UseBasicParsing
  $noShowData = $noShow.Content | ConvertFrom-Json
  Write-Host "   Count: $($noShowData.count)" -ForegroundColor Green
  if ($noShowData.count -gt 0) {
    Write-Host "   Sample: $($noShowData.data[0] | ConvertTo-Json)" -ForegroundColor Gray
  }
} catch {
  Write-Host "   Error: $_" -ForegroundColor Red
}

Write-Host ""

# Doctor Load Forecast
Write-Host "2. Doctor Load Forecast:" -ForegroundColor Cyan
try {
  $doctor = Invoke-WebRequest -Uri 'http://localhost:5000/api/predictions/doctor-load' `
    -Headers $headers `
    -UseBasicParsing
  $doctorData = $doctor.Content | ConvertFrom-Json
  Write-Host "   Count: $($doctorData.count)" -ForegroundColor Green
} catch {
  Write-Host "   Error: $_" -ForegroundColor Red
}

Write-Host ""

# Medicine Demand
Write-Host "3. Medicine Demand Forecast:" -ForegroundColor Cyan
try {
  $medicine = Invoke-WebRequest -Uri 'http://localhost:5000/api/predictions/medicine-demand' `
    -Headers $headers `
    -UseBasicParsing
  $medicineData = $medicine.Content | ConvertFrom-Json
  Write-Host "   Count: $($medicineData.count)" -ForegroundColor Green
} catch {
  Write-Host "   Error: $_" -ForegroundColor Red
}

Write-Host ""

# Bed Occupancy
Write-Host "4. Bed Occupancy Forecast:" -ForegroundColor Cyan
try {
  $occupancy = Invoke-WebRequest -Uri 'http://localhost:5000/api/predictions/bed-occupancy' `
    -Headers $headers `
    -UseBasicParsing
  $occupancyData = $occupancy.Content | ConvertFrom-Json
  Write-Host "   Count: $($occupancyData.count)" -ForegroundColor Green
} catch {
  Write-Host "   Error: $_" -ForegroundColor Red
}

Write-Host ""

# Billing Risk
Write-Host "5. Billing Risk Scores:" -ForegroundColor Cyan
try {
  $billing = Invoke-WebRequest -Uri 'http://localhost:5000/api/predictions/billing-risk' `
    -Headers $headers `
    -UseBasicParsing
  $billingData = $billing.Content | ConvertFrom-Json
  Write-Host "   Count: $($billingData.count)" -ForegroundColor Green
} catch {
  Write-Host "   Error: $_" -ForegroundColor Red
}

Write-Host ""

# Summary
Write-Host "6. Prediction Summary:" -ForegroundColor Cyan
try {
  $summary = Invoke-WebRequest -Uri 'http://localhost:5000/api/predictions/summary' `
    -Headers $headers `
    -UseBasicParsing
  $summaryData = $summary.Content | ConvertFrom-Json
  Write-Host "   High Risk No-Shows: $($summaryData.summary.no_show_high_risk)" -ForegroundColor Green
  Write-Host "   High Load Doctors: $($summaryData.summary.doctor_high_load)" -ForegroundColor Green
  Write-Host "   Urgent Medicines: $($summaryData.summary.medicine_urgent)" -ForegroundColor Green
  Write-Host "   High Occupancy: $($summaryData.summary.occupancy_high)" -ForegroundColor Green
  Write-Host "   High Risk Bills: $($summaryData.summary.billing_high_risk)" -ForegroundColor Green
} catch {
  Write-Host "   Error: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "✅ Prediction API testing complete!" -ForegroundColor Green
