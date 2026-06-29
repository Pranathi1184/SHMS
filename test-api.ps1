# Test Prediction APIs
$body = @{
    email = "admin@shms.com"
    password = "admin123"
} | ConvertTo-Json

# Login
Write-Host "Logging in..." -ForegroundColor Cyan
$response = Invoke-WebRequest -Uri 'http://localhost:5000/api/auth/login' `
    -Method Post `
    -ContentType 'application/json' `
    -Body $body `
    -UseBasicParsing

$loginData = $response.Content | ConvertFrom-Json
$token = $loginData.data.access_token

Write-Host "✅ Login successful" -ForegroundColor Green
Write-Host ""

# Test endpoints
$headers = @{
    Authorization = "Bearer $token"
    ContentType = 'application/json'
}

Write-Host "Testing Prediction APIs:" -ForegroundColor Cyan
Write-Host ""

try {
    Write-Host "1. Prediction Summary:" -ForegroundColor Yellow
    $resp = Invoke-WebRequest -Uri 'http://localhost:5000/api/predictions/summary' `
        -Headers $headers `
        -UseBasicParsing
    $data = $resp.Content | ConvertFrom-Json
    Write-Host "   ✅ Status: OK" -ForegroundColor Green
    Write-Host "   High Risk No-Shows: $($data.summary.no_show_high_risk)" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "   ❌ Error: $_" -ForegroundColor Red
    Write-Host ""
}

try {
    Write-Host "2. No-Show Predictions:" -ForegroundColor Yellow
    $resp = Invoke-WebRequest -Uri 'http://localhost:5000/api/predictions/no-show' `
        -Headers $headers `
        -UseBasicParsing
    $data = $resp.Content | ConvertFrom-Json
    Write-Host "   ✅ Status: OK - Found $($data.count) records" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "   ❌ Error: $_" -ForegroundColor Red
    Write-Host ""
}

try {
    Write-Host "3. Doctor Load Forecast:" -ForegroundColor Yellow
    $resp = Invoke-WebRequest -Uri 'http://localhost:5000/api/predictions/doctor-load' `
        -Headers $headers `
        -UseBasicParsing
    $data = $resp.Content | ConvertFrom-Json
    Write-Host "   ✅ Status: OK - Found $($data.count) records" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "   ❌ Error: $_" -ForegroundColor Red
    Write-Host ""
}

try {
    Write-Host "4. Medicine Demand:" -ForegroundColor Yellow
    $resp = Invoke-WebRequest -Uri 'http://localhost:5000/api/predictions/medicine-demand' `
        -Headers $headers `
        -UseBasicParsing
    $data = $resp.Content | ConvertFrom-Json
    Write-Host "   ✅ Status: OK - Found $($data.count) records" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "   ❌ Error: $_" -ForegroundColor Red
    Write-Host ""
}

try {
    Write-Host "5. Bed Occupancy:" -ForegroundColor Yellow
    $resp = Invoke-WebRequest -Uri 'http://localhost:5000/api/predictions/bed-occupancy' `
        -Headers $headers `
        -UseBasicParsing
    $data = $resp.Content | ConvertFrom-Json
    Write-Host "   ✅ Status: OK - Found $($data.count) records" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "   ❌ Error: $_" -ForegroundColor Red
    Write-Host ""
}

try {
    Write-Host "6. Billing Risk:" -ForegroundColor Yellow
    $resp = Invoke-WebRequest -Uri 'http://localhost:5000/api/predictions/billing-risk' `
        -Headers $headers `
        -UseBasicParsing
    $data = $resp.Content | ConvertFrom-Json
    Write-Host "   ✅ Status: OK - Found $($data.count) records" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "   ❌ Error: $_" -ForegroundColor Red
    Write-Host ""
}

Write-Host "✅ API Testing Complete!" -ForegroundColor Green
