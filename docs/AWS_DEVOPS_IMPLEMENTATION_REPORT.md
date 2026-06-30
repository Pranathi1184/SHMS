# SHMS AWS + DevOps Implementation Report

## Step 1: Current Project Analysis

### Architecture Summary
- Frontend: React + Vite + Nginx container
- Backend: Node.js + Express + Sequelize
- Database: PostgreSQL
- ETL/AI Analytics: Airflow + Python ETL (extract/transform/load/predict)
- CI/CD: GitHub Actions
- Infra as Code: CloudFormation templates under [infrastructure/aws](../infrastructure/aws)

### Status Matrix

#### AWS Components
- VPC: IMPLEMENTED
- Security Groups: IMPLEMENTED
- IAM Roles: IMPLEMENTED
- EC2 backend deployment: IMPLEMENTED
- PostgreSQL on RDS: IMPLEMENTED
- S3 for patient documents: IMPLEMENTED
- CloudFront for React frontend: IMPLEMENTED
- CloudWatch logging/monitoring: IMPLEMENTED
- Basic CloudFormation templates: IMPLEMENTED
- Lambda for reminders: PARTIALLY IMPLEMENTED (optional stack and endpoint wiring)

#### DevOps Components
- Docker backend/frontend/db/airflow: IMPLEMENTED
- Airflow scheduler for ETL automation: IMPLEMENTED
- GitHub Actions CI pipeline: IMPLEMENTED
- GitHub Actions CD to EC2: IMPLEMENTED
- Deployment scripts/runbooks: IMPLEMENTED

## Step 2–6: What Was Fixed and Implemented

### AWS Infra Templates
1. [infrastructure/aws/vpc.yaml](../infrastructure/aws/vpc.yaml)
- Added parameterized CIDRs
- Added private subnets for RDS
- Added complete route associations and outputs

2. [infrastructure/aws/ec2-backend.yaml](../infrastructure/aws/ec2-backend.yaml)
- Added IAM role + instance profile
- Added optional S3 access policy for patient documents
- Added configurable instance type, key pair, ports, image tags
- Added cloud-init Docker Compose deployment for backend/frontend containers
- Added CloudWatch log groups and alarms

3. [infrastructure/aws/rds.yaml](../infrastructure/aws/rds.yaml)
- Added free-tier defaults and DB identifier/name params
- Added encrypted storage and backup retention
- Added ingress control from backend SG or VPC CIDR fallback
- Added detailed outputs for endpoint, port, identifiers

4. [infrastructure/aws/frontend-cloudfront.yaml](../infrastructure/aws/frontend-cloudfront.yaml)
- Switched to private S3 + CloudFront Origin Access Control
- Added SPA error routing (403/404 to index.html)
- Added patient documents S3 bucket (encrypted, versioned, lifecycle)
- Added CloudFront 4xx alarm and distribution ID output

5. [infrastructure/aws/lambda.yaml](../infrastructure/aws/lambda.yaml)
- Made Lambda optional via parameter
- Added configurable schedule/API URL/token
- Added logs and CloudWatch alarms

### DevOps and CI/CD
1. [.github/workflows/main.yml](../.github/workflows/main.yml)
- Added Postgres test service and deterministic test/build stages
- Kept GitHub Actions (as required)
- Added manual dispatch input for optional deploy target
- Gated deploy jobs so CI works even before EC2 setup

2. [docs/CI_CD_PIPELINE_RUNBOOK.md](CI_CD_PIPELINE_RUNBOOK.md)
- Documents secrets, environments, validation flow

### Docker + ETL Reliability
1. [docker-compose.yml](../docker-compose.yml)
- Removed hardcoded DB credentials from Airflow
- Added `airflow-scheduler` service to make daily ETL schedule functional
- Kept local PostgreSQL, backend, frontend, and airflow services

## Step 7: Verification Done

### Verified During Implementation
- Frontend Docker deployment with Nginx API proxy
- Backend health and prediction endpoint behavior
- Frontend production build success
- Docker services health checks

### Verified by Configuration Review
- ETL DAG order remains Extract -> Transform -> Load -> Predict
- CloudFormation templates now cover required AWS scope for free-tier demo
- CI/CD pipeline is runnable pre-EC2 (CI only) and post-EC2 (CI+CD)

## Files Modified
- [.github/workflows/main.yml](../.github/workflows/main.yml)
- [docker-compose.yml](../docker-compose.yml)
- [infrastructure/aws/vpc.yaml](../infrastructure/aws/vpc.yaml)
- [infrastructure/aws/ec2-backend.yaml](../infrastructure/aws/ec2-backend.yaml)
- [infrastructure/aws/rds.yaml](../infrastructure/aws/rds.yaml)
- [infrastructure/aws/frontend-cloudfront.yaml](../infrastructure/aws/frontend-cloudfront.yaml)
- [infrastructure/aws/lambda.yaml](../infrastructure/aws/lambda.yaml)

## Files Added
- [infrastructure/aws/deploy-free-tier.ps1](../infrastructure/aws/deploy-free-tier.ps1)
- [infrastructure/aws/publish-frontend.ps1](../infrastructure/aws/publish-frontend.ps1)
- [docs/AWS_FREE_TIER_DEPLOYMENT.md](AWS_FREE_TIER_DEPLOYMENT.md)
- [docs/AWS_DEVOPS_IMPLEMENTATION_REPORT.md](AWS_DEVOPS_IMPLEMENTATION_REPORT.md)

## Local Deployment (Demo)
1. Run `docker compose up -d --build`
2. Backend: `http://localhost:5000/health`
3. Frontend: `http://localhost`
4. Airflow: `http://localhost:8080`

## AWS Free-Tier Deployment (Demo)
1. Deploy infra using [infrastructure/aws/deploy-free-tier.ps1](../infrastructure/aws/deploy-free-tier.ps1)
2. Publish frontend via [infrastructure/aws/publish-frontend.ps1](../infrastructure/aws/publish-frontend.ps1)
3. Configure GitHub environment secrets
4. Trigger workflow for CI and deploy

## Future Enterprise Enhancements (Not Implemented by Design)
- ECS/EKS migration
- Auto-scaling groups and load balancer
- WAF + advanced API gateway
- Multi-region DR
- Blue/green deployments
- Managed secret rotation and advanced observability stack
