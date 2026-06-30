param(
  [string]$StackPrefix = "shms-demo",
  [string]$Region = "us-east-1",
  [Parameter(Mandatory = $true)]
  [string]$KeyPairName,
  [Parameter(Mandatory = $true)]
  [string]$DBUser,
  [Parameter(Mandatory = $true)]
  [string]$DBPassword,
  [Parameter(Mandatory = $true)]
  [string]$DockerHubUsername,
  [string]$BackendImageTag = "latest",
  [string]$FrontendImageTag = "latest",
  [string]$AllowedSshCidr = "0.0.0.0/0",
  [string]$FrontendBucketName = "",
  [string]$DocumentsBucketName = "",
  [string]$AlarmSNSTopicArn = ""
)

$ErrorActionPreference = "Stop"

function Get-StackOutputValue {
  param(
    [Parameter(Mandatory = $true)]
    [string]$StackName,
    [Parameter(Mandatory = $true)]
    [string]$OutputKey,
    [Parameter(Mandatory = $true)]
    [string]$Region
  )

  $value = aws cloudformation describe-stacks `
    --stack-name $StackName `
    --region $Region `
    --query "Stacks[0].Outputs[?OutputKey=='$OutputKey'].OutputValue | [0]" `
    --output text

  if (-not $value -or $value -eq "None") {
    throw "Output '$OutputKey' was not found in stack '$StackName'."
  }

  return $value
}

function Deploy-Stack {
  param(
    [Parameter(Mandatory = $true)]
    [string]$StackName,
    [Parameter(Mandatory = $true)]
    [string]$TemplateFile,
    [Parameter(Mandatory = $true)]
    [string]$Region,
    [string[]]$Parameters = @(),
    [string[]]$Capabilities = @()
  )

  $cmd = @(
    "cloudformation", "deploy",
    "--stack-name", $StackName,
    "--template-file", $TemplateFile,
    "--region", $Region,
    "--no-fail-on-empty-changeset"
  )

  if ($Parameters.Count -gt 0) {
    $cmd += "--parameter-overrides"
    $cmd += $Parameters
  }

  if ($Capabilities.Count -gt 0) {
    $cmd += "--capabilities"
    $cmd += $Capabilities
  }

  Write-Host "Deploying stack: $StackName" -ForegroundColor Cyan
  aws @cmd
}

if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
  throw "AWS CLI is required. Install and configure it before running this script."
}

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

$vpcStackName = "$StackPrefix-vpc"
$frontendStackName = "$StackPrefix-frontend"
$rdsStackName = "$StackPrefix-rds"
$ec2StackName = "$StackPrefix-ec2"

Deploy-Stack -StackName $vpcStackName -TemplateFile (Join-Path $scriptRoot "vpc.yaml") -Region $Region

$vpcId = Get-StackOutputValue -StackName $vpcStackName -OutputKey "VpcId" -Region $Region
$vpcCidr = Get-StackOutputValue -StackName $vpcStackName -OutputKey "VpcCidr" -Region $Region
$publicSubnet1 = Get-StackOutputValue -StackName $vpcStackName -OutputKey "PublicSubnet1" -Region $Region
$privateSubnet1 = Get-StackOutputValue -StackName $vpcStackName -OutputKey "PrivateSubnet1" -Region $Region
$privateSubnet2 = Get-StackOutputValue -StackName $vpcStackName -OutputKey "PrivateSubnet2" -Region $Region

$frontendParams = @()
if ($FrontendBucketName) { $frontendParams += "FrontendBucketName=$FrontendBucketName" }
if ($DocumentsBucketName) { $frontendParams += "DocumentsBucketName=$DocumentsBucketName" }
Deploy-Stack -StackName $frontendStackName -TemplateFile (Join-Path $scriptRoot "frontend-cloudfront.yaml") -Region $Region -Parameters $frontendParams

$documentsBucket = Get-StackOutputValue -StackName $frontendStackName -OutputKey "PatientDocumentsBucketNameOutput" -Region $Region
$distributionDomain = Get-StackOutputValue -StackName $frontendStackName -OutputKey "FrontendDistributionDomainName" -Region $Region

$rdsParams = @(
  "VpcId=$vpcId",
  "VpcCidr=$vpcCidr",
  "PrivateSubnet1Id=$privateSubnet1",
  "PrivateSubnet2Id=$privateSubnet2",
  "DBName=shms",
  "DBUser=$DBUser",
  "DBPassword=$DBPassword",
  "BackendSecurityGroupId=",
  "AlarmSNSTopicArn=$AlarmSNSTopicArn"
)
Deploy-Stack -StackName $rdsStackName -TemplateFile (Join-Path $scriptRoot "rds.yaml") -Region $Region -Parameters $rdsParams

$dbEndpoint = Get-StackOutputValue -StackName $rdsStackName -OutputKey "DBEndpoint" -Region $Region
$dbPort = Get-StackOutputValue -StackName $rdsStackName -OutputKey "DBPort" -Region $Region

$encodedPassword = [System.Uri]::EscapeDataString($DBPassword)
$dbUrl = "postgresql://$DBUser:$encodedPassword@$dbEndpoint`:$dbPort/shms"

$ec2Params = @(
  "VpcId=$vpcId",
  "SubnetId=$publicSubnet1",
  "KeyPairName=$KeyPairName",
  "AllowedSshCidr=$AllowedSshCidr",
  "DockerHubUsername=$DockerHubUsername",
  "BackendImageTag=$BackendImageTag",
  "FrontendImageTag=$FrontendImageTag",
  "DatabaseUrl=$dbUrl",
  "AwsRegion=$Region",
  "DocumentsBucketName=$documentsBucket",
  "AlarmSNSTopicArn=$AlarmSNSTopicArn"
)
Deploy-Stack -StackName $ec2StackName -TemplateFile (Join-Path $scriptRoot "ec2-backend.yaml") -Region $Region -Parameters $ec2Params -Capabilities @("CAPABILITY_NAMED_IAM")

$backendSgId = Get-StackOutputValue -StackName $ec2StackName -OutputKey "BackendSecurityGroupId" -Region $Region

$rdsParamsTightened = @(
  "VpcId=$vpcId",
  "VpcCidr=$vpcCidr",
  "PrivateSubnet1Id=$privateSubnet1",
  "PrivateSubnet2Id=$privateSubnet2",
  "DBName=shms",
  "DBUser=$DBUser",
  "DBPassword=$DBPassword",
  "BackendSecurityGroupId=$backendSgId",
  "AlarmSNSTopicArn=$AlarmSNSTopicArn"
)
Deploy-Stack -StackName $rdsStackName -TemplateFile (Join-Path $scriptRoot "rds.yaml") -Region $Region -Parameters $rdsParamsTightened

$publicIp = Get-StackOutputValue -StackName $ec2StackName -OutputKey "PublicIp" -Region $Region

Write-Host "" 
Write-Host "Deployment complete." -ForegroundColor Green
Write-Host "Backend URL: http://$publicIp:5000"
Write-Host "Frontend URL: http://$publicIp"
Write-Host "CloudFront URL: https://$distributionDomain"
Write-Host "Documents bucket: $documentsBucket"
