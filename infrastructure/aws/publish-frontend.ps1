param(
  [Parameter(Mandatory = $true)]
  [string]$BucketName,
  [Parameter(Mandatory = $true)]
  [string]$DistributionId,
  [string]$Region = "us-east-1"
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
  throw "AWS CLI is required. Install and configure it before running this script."
}

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$frontendPath = Join-Path $repoRoot "frontend"

Push-Location $frontendPath
try {
  npm ci
  npm run build
} finally {
  Pop-Location
}

$distPath = Join-Path $frontendPath "dist"
if (-not (Test-Path $distPath)) {
  throw "Frontend dist folder was not generated."
}

aws s3 sync $distPath "s3://$BucketName" --delete --region $Region
aws cloudfront create-invalidation --distribution-id $DistributionId --paths "/*" --region $Region | Out-Null

Write-Host "Frontend published to S3 and CloudFront invalidated." -ForegroundColor Green
