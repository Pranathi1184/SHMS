# Test all prediction API endpoints
$body = @{
    email = "admin@shms.com"
    password = "admin123"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri 'http://localhost:5000/api/auth/login' `
        -Method Post `
        -ContentType 'application/json' `
        -Body $body `
        -UseBasicParsing
    
    $loginData = $response.Content | ConvertFrom-Json
    $token = $loginData.data.access_token

    Write-Host "✅ Authentication successful" -ForegroundColor Green
    Write-Host ""
    
    $headers = @{ Authorization = "Bearer $token" }

    Write-Host "Testing Prediction API Endpoints:" -ForegroundColor Cyan
    Write-Host "================================" -ForegroundColor Cyan
    Write-Host ""

    # 1. No-Show Predictions
    try {
        $resp = Invoke-WebRequest -Uri 'http://localhost:5000/api/predictions/no-show' `
            -Headers $headers -UseBasicParsing
        $data = $resp.Content | ConvertFrom-Json
        Write-Host "1. No-Show Predictions" -ForegroundColor Yellow
        Write-Host "   ✅ Status 200 | Records: $($data.count)" -ForegroundColor Green
        Write-Host ""
    } catch {
        Write-Host "1. No-Show Predictions ❌ $_" -ForegroundColor Red
        Write-Host ""
    }

    # 2. Doctor Load
    try {
        $resp = Invoke-WebRequest -Uri 'http://localhost:5000/api/predictions/doctor-load' `
            -Headers $headers -UseBasicParsing
        $data = $resp.Content | ConvertFrom-Json
        Write-Host "2. Doctor Load Forecast" -ForegroundColor Yellow
        Write-Host "   ✅ Status 200 | Records: $($data.count)" -ForegroundColor Green
        Write-Host ""
    } catch {
        Write-Host "2. Doctor Load ❌ $_" -ForegroundColor Red
        Write-Host ""
    }

    # 3. Medicine Demand
    try {
        $resp = Invoke-WebRequest -Uri 'http://localhost:5000/api/predictions/medicine-demand' `
            -Headers $headers -UseBasicParsing
        $data = $resp.Content | ConvertFrom-Json
        Write-Host "3. Medicine Demand Forecast" -ForegroundColor Yellow
        Write-Host "   ✅ Status 200 | Records: $($data.count)" -ForegroundColor Green
        Write-Host ""
    } catch {
        Write-Host "3. Medicine Demand ❌ $_" -ForegroundColor Red
        Write-Host ""
    }

    # 4. Bed Occupancy
    try {
        $resp = Invoke-WebRequest -Uri 'http://localhost:5000/api/predictions/bed-occupancy' `
            -Headers $headers -UseBasicParsing
        $data = $resp.Content | ConvertFrom-Json
        Write-Host "4. Bed Occupancy Forecast" -ForegroundColor Yellow
        Write-Host "   ✅ Status 200 | Records: $($data.count)" -ForegroundColor Green
        Write-Host ""
    } catch {
        Write-Host "4. Bed Occupancy ❌ $_" -ForegroundColor Red
        Write-Host ""
    }

    # 5. Billing Risk
    try {
        $resp = Invoke-WebRequest -Uri 'http://localhost:5000/api/predictions/billing-risk' `
            -Headers $headers -UseBasicParsing
        $data = $resp.Content | ConvertFrom-Json
        Write-Host "5. Billing Risk Scores" -ForegroundColor Yellow
        Write-Host "   ✅ Status 200 | Records: $($data.count)" -ForegroundColor Green
        Write-Host ""
    } catch {
        Write-Host "5. Billing Risk ❌ $_" -ForegroundColor Red
        Write-Host ""
    }

    # 6. Summary
    try {
        $resp = Invoke-WebRequest -Uri 'http://localhost:5000/api/predictions/summary' `
            -Headers $headers -UseBasicParsing
        $data = $resp.Content | ConvertFrom-Json
        Write-Host "6. Predictions Summary (Admin)" -ForegroundColor Yellow
        Write-Host "   ✅ Status 200" -ForegroundColor Green
        Write-Host "   High Risk No-Shows: $($data.summary.no_show_high_risk)" -ForegroundColor Green
        Write-Host "   High Load Doctors: $($data.summary.doctor_high_load)" -ForegroundColor Green
        Write-Host ""
    } catch {
        Write-Host "6. Summary ❌ $_" -ForegroundColor Red
        Write-Host ""
    }

    Write-Host "✅ API Testing Complete!" -ForegroundColor Green

} catch {
    Write-Host "❌ Login failed: $_" -ForegroundColor Red
}
