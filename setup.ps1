param(
    [switch]$SkipInstall,
    [switch]$SkipSeed,
    [switch]$NoStartApps
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPath = Join-Path $repoRoot 'backend'
$frontendPath = Join-Path $repoRoot 'frontend'
$backendEnvExample = Join-Path $backendPath '.env.example'
$backendEnv = Join-Path $backendPath '.env'

function Invoke-Step {
    param(
        [string]$Title,
        [scriptblock]$Action
    )

    Write-Host "`n==> $Title" -ForegroundColor Cyan
    & $Action
}

if (-not (Test-Path $backendPath)) { throw "backend folder not found at $backendPath" }
if (-not (Test-Path $frontendPath)) { throw "frontend folder not found at $frontendPath" }

Invoke-Step -Title 'Preparing backend environment file' -Action {
    if (-not (Test-Path $backendEnv) -and (Test-Path $backendEnvExample)) {
        Copy-Item $backendEnvExample $backendEnv
        Write-Host 'Created backend/.env from backend/.env.example' -ForegroundColor Yellow
        Write-Host 'Please review backend/.env values after bootstrap if needed.' -ForegroundColor Yellow
    }
}

if (-not $SkipInstall) {
    Invoke-Step -Title 'Installing backend dependencies' -Action {
        Set-Location $backendPath
        npm install
    }

    Invoke-Step -Title 'Installing frontend dependencies' -Action {
        Set-Location $frontendPath
        npm install
    }
}

if (-not $SkipSeed) {
    Invoke-Step -Title 'Ensuring PostgreSQL database exists' -Action {
        Set-Location $backendPath
        node scripts/ensure-db.js
    }

    Invoke-Step -Title 'Syncing schema and seeding baseline data' -Action {
        Set-Location $backendPath
        node run-seed.js
    }
}

Set-Location $repoRoot

if (-not $NoStartApps) {
    Invoke-Step -Title 'Starting backend and frontend in separate PowerShell windows' -Action {
        Start-Process powershell -ArgumentList @(
            '-NoExit',
            '-Command',
            "Set-Location '$backendPath'; npm run dev"
        )

        Start-Process powershell -ArgumentList @(
            '-NoExit',
            '-Command',
            "Set-Location '$frontendPath'; npm run dev"
        )
    }

    Write-Host "`nBootstrap complete." -ForegroundColor Green
    Write-Host 'Backend: http://localhost:5000' -ForegroundColor Green
    Write-Host 'Frontend: http://localhost:5173' -ForegroundColor Green
} else {
    Write-Host "`nBootstrap complete (apps not started because -NoStartApps was provided)." -ForegroundColor Green
}
