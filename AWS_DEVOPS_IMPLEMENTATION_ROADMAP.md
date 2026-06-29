# SHMS ETL Pipeline & AWS/DevOps Implementation Review

## 📊 ETL PIPELINE CHECKOVER

### Current Implementation Status ✅

#### **Extract Phase** (`etl/scripts/extract.py`)
**Status:** ✅ FULLY IMPLEMENTED

**What it does:**
- Connects to source PostgreSQL database (from `backend`)
- Incremental extraction using watermark column (`created_at`, `updated_at`, `bill_date`, `appointment_date`, `admission_date`)
- Extracts 6 core tables:
  - `patients` - Demographics, contact, health info
  - `appointments` - Scheduling, doctor assignments
  - `bills` - Revenue tracking
  - `medicines` - Inventory data
  - `admissions` - Hospital stay records
  - `prescription_items` - Medication usage patterns
- **Output:** CSV files in `raw/` directory (e.g., `patients.csv`, `bills.csv`)
- **Retry Logic:** 3 attempts with exponential backoff
- **Incremental Mode:** Defaults to `full` (full refresh) but supports incremental
- **State Management:** Saves watermarks in `etl_state.json` for resume capability

**Source Data Dependencies:**
- ✅ Patients: Database synced, seed data available
- ✅ Appointments: Database synced, seed data available
- ✅ Bills: Database synced, seed data available
- ✅ Medicines: Database synced, seed data available
- ✅ Admissions: Database synced, seed data available
- ✅ Prescription Items: Database synced, seed data available

**Current Limitation:**
- Extracts data as-is from backend database
- Quality depends on data seeding
- No data validation in extract phase (happens in transform)

---

#### **Transform Phase** (`etl/scripts/transform.py`)
**Status:** ✅ FULLY IMPLEMENTED

**What it does:**
- Reads CSV files from `raw/` directory
- Performs data cleaning and aggregation:
  1. **Daily Revenue** - Groups bills by date, calculates sum and count
  2. **Patient Trends** - New patients per day + appointment volume
  3. **Popular Medicines** - Top 10 medicines by prescription volume
  4. **Average Stay Duration** - Calculates admission-to-discharge intervals
  5. **Appointment Features** - Slot utilization, doctor performance metrics
  6. **Inventory Features** - Stock levels, usage velocity
- **Output:** Processed CSV files in `processed/` directory
- **Schema Validation:** Ensures all transformations match expected schema
- **Error Handling:** Required column checks prevent partial transforms
- **Data Type Conversion:** Automatic datetime parsing with mixed format support

**Transformation Details:**
```
Input: raw/bills.csv, raw/appointments.csv, raw/patients.csv, etc.
↓
Logic: Aggregations, groupby operations, datetime parsing
↓
Output: processed/daily_revenue.csv, processed/patient_trends.csv, etc.
```

**Current Limitation:**
- Depends on extract phase data quality
- No ML feature engineering (ready for enhancement)
- Aggregate-only (no row-level transformations)

---

#### **Load Phase** (`etl/scripts/load.py`)
**Status:** ✅ FULLY IMPLEMENTED

**What it does:**
- Reads processed CSV files from `processed/` directory
- Creates/updates analytics tables in PostgreSQL
- Tables created:
  - `daily_revenue_analytics` - Revenue trends
  - `patient_trends_analytics` - Patient growth
  - `medicine_popularity_analytics` - Medicine usage
  - `average_stay_analytics` - Length of stay
  - `appointment_analytics` - Appointment metrics
  - `inventory_analytics` - Stock status
- **Load Strategy:** Replace entire table (full refresh, idempotent)
- **Transaction:** All-or-nothing atomicity
- **Performance:** Direct pandas to_sql with sqlalchemy
- **Logging:** Success/failure status for each table

**Database Schema:**
```sql
CREATE TABLE daily_revenue_analytics (
  date DATE PRIMARY KEY,
  total_revenue NUMERIC,
  total_bills INTEGER
);

CREATE TABLE patient_trends_analytics (
  date DATE PRIMARY KEY,
  new_patients INTEGER,
  total_appointments INTEGER
);
-- ... similar structure for other tables
```

**Current Limitation:**
- Full refresh only (no incremental loading)
- No data lineage tracking
- No archival of historical analytics runs

---

#### **Predict Phase** (`etl/scripts/predict.py`)
**Status:** ⚠️ PARTIALLY IMPLEMENTED (Placeholder)

**What it does:**
- Currently a stub: logs message and returns success
- **Location:** `etl/scripts/predict.py`
- **Future Purpose:** Run ML models (patient readmission risk, revenue forecasting, etc.)

**Current Implementation:**
```python
def run_predictions(mode=None):
    logger.info('Running predictions...')
    # Placeholder for ML inference
    return {'status': 'predictions_completed'}
```

**Opportunity for Enhancement:**
- Readmission risk scoring
- Patient LOS predictions
- Revenue forecasting
- Medicine demand forecasting

---

### Airflow DAG Structure ✅

**Location:** `etl/dags/shms_daily_etl.py`

**Current Configuration:**
```
DAG: shms_daily_analytics_etl
├─ Trigger: Daily at 00:00 UTC (configurable)
├─ Executor: LocalExecutor (single-machine)
├─ Max Active Runs: 1 (prevents concurrent runs)
├─ Retry: 1 attempt, 5 min delay
└─ Tasks:
   ├─ extract_data (5s typical)
   ├─ transform_data (2s typical)
   ├─ load_data (1s typical)
   └─ run_predictions (1s typical)
   
   Total: ~37 seconds typical execution
```

**Execution Flow:**
```
extract_task >> transform_task >> load_data >> predict_task
    (sequential, no parallelization)
```

**Monitoring:**
- ✅ Airflow webserver on port 8080
- ✅ Task status visible in UI
- ✅ Logs accessible per task
- ✅ Email alerts on failure (not configured)

---

### Data Quality & Validation ✅

**Validation Framework** (`etl/scripts/validation.py`)

**Checks Implemented:**
1. **Required Input Files:** Validates all 6 CSVs exist from extract
2. **Required Columns:** Each transform checks for expected columns
3. **Expected Output Schema:** Each output file validates against schema definition
4. **Row Count:** Ensures transforms produce output (non-zero rows)

**Example:**
```python
# From transform.py
ensure_required_columns(bills, ['bill_date', 'payment_status', 'net_amount'], 'bills.csv')
ensure_expected_output_schema(dataframe, 'daily_revenue.csv')
```

**Missing Validations** (opportunities):
- ❌ Null/completeness checks
- ❌ Outlier detection
- ❌ Referential integrity checks
- ❌ Duplicates detection

---

### Current Pipeline Execution (Local)

**Status:** ✅ TESTED AND WORKING

**Test Results from Previous Session:**
```
✅ Extract: All 6 tables extracted successfully
✅ Transform: 6 analytics datasets created
✅ Load: All tables loaded into analytics schema
✅ Predict: Placeholder ran successfully
✅ Total execution time: ~37 seconds
```

**Current Data State:**
- Seed data from `backend/seed.js` contains ~10 patients, 30+ appointments
- Daily revenue populated with demo bills
- Patient trends calculated from appointment history
- Medicine popularity from prescription data

---

## 🚀 AWS INFRASTRUCTURE REVIEW

### Current AWS Templates Status ⚠️ (NOT DEPLOYED)

#### **1. VPC Template** (`infrastructure/aws/vpc.yaml`)
**Status:** ✅ WELL-DEFINED

**Components Defined:**
- VPC: 10.0.0.0/16 (16,384 IP addresses)
- Internet Gateway for public internet access
- 2 Public Subnets: 10.0.1.0/24, 10.0.2.0/24 (Multi-AZ)
- 1 Private Subnet: 10.0.3.0/24 (for database)
- Route tables for public/private routing
- NAT Gateway for outbound-only private access
- Network ACLs and security groups

**Ready for Deployment:** YES ✅

---

#### **2. RDS Database Template** (`infrastructure/aws/rds.yaml`)
**Status:** ✅ WELL-DEFINED

**Configuration:**
- PostgreSQL 15 (production-grade)
- db.t3.micro instance (development tier)
- 20GB allocated storage
- Multi-AZ: false (can enable for HA)
- Backup retention: default (7 days)
- Encryption: default (at-rest)
- Security group restricts to VPC-only (10.0.0.0/16)

**Monitoring:**
- CPU utilization alarm (threshold: 80%)
- Free storage alarm
- Connection count monitoring

**Ready for Deployment:** YES ✅
**Note:** Needs credential parameters at deployment

---

#### **3. EC2 Backend Template** (`infrastructure/aws/ec2-backend.yaml`)
**Status:** ✅ WELL-DEFINED

**Configuration:**
- Instance type: t3.small (1 vCPU, 2GB RAM)
- AMI: Amazon Linux 2023
- Security group allows:
  - Port 80 (HTTP)
  - Port 22 (SSH)
  - Port 443 (HTTPS - not in template yet)
- User data script: Installs Docker

**Monitoring:**
- CloudWatch alarms for CPU
- Instance status checks
- Log group for application logs

**Missing/Needs Update:**
- ❌ No Docker-compose deployment in UserData
- ❌ No environment variables setup
- ❌ No application health check endpoint
- ❌ No auto-scaling configuration

**Ready for Deployment:** PARTIAL ⚠️
**Status:** Needs UserData script enhancement

---

#### **4. Frontend CloudFront Template** (`infrastructure/aws/frontend-cloudfront.yaml`)
**Status:** ✅ DEFINED

**Configuration:**
- S3 bucket for static files
- CloudFront distribution for CDN
- Origin Access Control (OAC) for S3 private access
- Cache policies for assets

**Ready for Deployment:** YES ✅

---

#### **5. Lambda Template** (`infrastructure/aws/lambda.yaml`)
**Status:** ⚠️ PARTIAL

**Purpose:** Serverless functions (currently placeholder)

**Typical Use Cases:**
- Automated backups
- Data validation triggers
- ETL orchestration (alternative to EC2)

**Status:** Skeleton defined, needs implementation

---

### AWS Deployment Architecture

**Current Design:**
```
┌─────────────────────────────────────────────────────┐
│             AWS Account (Production)                 │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │  VPC (10.0.0.0/16)                          │   │
│  │  ┌────────────────────────────────────────┐ │   │
│  │  │  Public Subnets (10.0.1.0, 10.0.2.0)   │ │   │
│  │  │  ├─ EC2: Backend API (t3.small)        │ │   │
│  │  │  └─ NAT Gateway                        │ │   │
│  │  └────────────────────────────────────────┘ │   │
│  │                                              │   │
│  │  ┌────────────────────────────────────────┐ │   │
│  │  │  Private Subnet (10.0.3.0/24)         │ │   │
│  │  │  └─ RDS: PostgreSQL (db.t3.micro)     │ │   │
│  │  └────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │  S3 + CloudFront (Static Frontend)           │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
└─────────────────────────────────────────────────────┘
```

**What's Missing:**
- ❌ Load balancer (ALB) for HA
- ❌ Auto Scaling Group for EC2
- ❌ Secrets Manager for credentials
- ❌ VPC endpoints for private services
- ❌ WAF (Web Application Firewall)
- ❌ Backup/restore automation
- ❌ Disaster recovery setup

---

## 🔄 CI/CD PIPELINE REVIEW

### Current GitHub Actions Setup ✅

**Location:** `.github/workflows/main.yml`

**Pipeline Stages:**

#### **Stage 1: Test**
```yaml
- Setup Node.js 18
- npm install (backend)
- npm test (backend) ← Tests in backend/tests/
- npm install (frontend)
- npm test (frontend) ← Tests in frontend/tests/
```

**Status:** ✅ IMPLEMENTED
**Trigger:** On push to main/develop, on PR to main

**Current Test Coverage:**
- Backend: `backend/tests/agent.test.js`, `auth.test.js`, `patient.test.js`, `ai.test.js`
- Frontend: Tests exist in frontend/tests/ (structure present)

**Limitation:** Tests basic functionality only; no integration tests

---

#### **Stage 2: Build & Push Docker Images**
```yaml
- Resolve image tags (short SHA, env branch)
- Set up Docker Buildx
- Login to DockerHub
- Build & push Backend image
- Build & push Frontend image
```

**Status:** ✅ IMPLEMENTED

**Image Naming Convention:**
- **Development:** `{username}/shms-backend:dev-{short_sha}`
- **Production:** `{username}/shms-backend:prod-{short_sha}`
- **Latest:** `{username}/shms-backend:latest`

**Required Secrets:**
- `DOCKERHUB_USERNAME` - DockerHub account
- `DOCKERHUB_TOKEN` - DockerHub access token

---

#### **Stage 3: Deploy Development**
```yaml
- Triggered on push to develop
- SSH into dev EC2 instance
- docker-compose pull (latest images)
- docker-compose up -d (restart services)
- Health check (curl /health endpoint)
```

**Status:** ✅ IMPLEMENTED

**Required Secrets:**
- `EC2_HOST_DEV` - Development EC2 public IP
- `EC2_USER_DEV` - SSH user (ubuntu/ec2-user)
- `EC2_SSH_KEY_DEV` - Private SSH key

**Concurrency:** Max 1 concurrent deployment (prevents conflicts)

---

#### **Stage 4: Deploy Production**
```yaml
- Triggered on push to main
- SSH into prod EC2 instance
- docker-compose pull
- docker-compose up -d
- Health check
```

**Status:** ✅ IMPLEMENTED

**Required Secrets:**
- `EC2_HOST_PROD` - Production EC2 public IP
- `EC2_USER_PROD` - SSH user
- `EC2_SSH_KEY_PROD` - Private SSH key

**Environment:** GitHub environment protection applied

**Concurrency:** Max 1 concurrent deployment

---

### CI/CD Pipeline Flow

```
Code Push (main/develop)
    ↓
[Test Stage] ← Runs on Ubuntu
  - Backend tests
  - Frontend tests
  - Fail blocks next stages
    ↓ (if passed)
[Build & Push] ← Builds Docker images
  - Backend image → DockerHub
  - Frontend image → DockerHub
    ↓
[Deploy Dev] ← if branch=develop
  - SSH to dev EC2
  - Pull images
  - Restart containers
  - Health check
    ↓
[Deploy Prod] ← if branch=main
  - SSH to prod EC2
  - Pull images
  - Restart containers
  - Health check
```

---

## 📋 IMPLEMENTATION ROADMAP

### Phase 1: AWS Infrastructure Deployment (2-3 days)

**Step 1: Prepare AWS Account**
- [ ] Create AWS account
- [ ] Configure AWS credentials (Access Key ID + Secret)
- [ ] Create S3 bucket for CloudFormation templates
- [ ] Set up billing alerts

**Step 2: Deploy Core Infrastructure Stack**
- [ ] Deploy VPC template (creates networking foundation)
- [ ] Deploy RDS template (creates database)
  - Requires: DB username/password parameters
  - Creates: PostgreSQL 15 instance in private subnet
  - Output: RDS endpoint (needed for application)
- [ ] Deploy EC2 template (creates backend instance)
  - Requires: VPC ID, Subnet ID (from VPC stack)
  - Creates: EC2 t3.small instance with Docker pre-installed
  - Output: EC2 public IP (needed for SSH)

**Step 3: Configure EC2 for Deployment**
- [ ] SSH into EC2 instance
- [ ] Clone SHMS repository
- [ ] Create `.env` file with database credentials
  - DATABASE_URL pointing to RDS endpoint
  - JWT secrets
  - AI provider keys (Groq, OpenAI)
- [ ] Copy docker-compose.yml to EC2
- [ ] Update docker-compose to use RDS endpoint (not local db)
- [ ] Run initial docker-compose up to seed database

**Step 4: Deploy Frontend (CloudFront + S3)**
- [ ] Deploy CloudFront template
- [ ] Build frontend: `npm run build`
- [ ] Upload dist/ folder to S3
- [ ] Configure CloudFront origin to point to S3
- [ ] Update backend CORS to allow CloudFront domain

**Deliverables:**
- VPC with public/private subnets
- RDS PostgreSQL instance (production-grade)
- EC2 instance running Docker (backend + Airflow)
- S3 + CloudFront serving frontend
- Health check endpoints responding

---

### Phase 2: CI/CD Pipeline Activation (1-2 days)

**Step 1: Set Up GitHub Secrets**
- [ ] Create GitHub repository
- [ ] Add DockerHub credentials
  - `DOCKERHUB_USERNAME`
  - `DOCKERHUB_TOKEN`
- [ ] Add Development EC2 secrets
  - `EC2_HOST_DEV` - EC2 public IP (dev environment)
  - `EC2_USER_DEV` - SSH username
  - `EC2_SSH_KEY_DEV` - Private SSH key
- [ ] Add Production EC2 secrets
  - `EC2_HOST_PROD` - EC2 public IP (prod environment)
  - `EC2_USER_PROD` - SSH username
  - `EC2_SSH_KEY_PROD` - Private SSH key
- [ ] Set up GitHub Environments: development, production

**Step 2: Prepare EC2 Instances**
- [ ] Ensure docker-compose.yml in `/home/{user}/shms/`
- [ ] Create `.env` with all needed variables
- [ ] Create docker-compose deployment user (not root)
- [ ] Configure SSH key-based auth for GitHub Actions
- [ ] Test SSH connectivity: `ssh -i key.pem user@ec2-host`

**Step 3: Test Pipeline**
- [ ] Push to develop branch → trigger deploy-dev
- [ ] Verify dev EC2 gets new version
- [ ] Health check passes
- [ ] Push to main branch → trigger deploy-prod
- [ ] Verify prod EC2 gets new version
- [ ] Production health check passes

**Deliverables:**
- GitHub Actions successfully building Docker images
- dev branch commits deploy to development EC2
- main branch commits deploy to production EC2
- Docker images stored in DockerHub
- Zero-downtime deployments (docker-compose pull + up -d)

---

### Phase 3: ETL Infrastructure Enhancements (1-2 days)

**Step 1: Enhance Airflow Deployment**
- [ ] Update Airflow to use RDS (not local SQLite)
- [ ] Configure Airflow scheduler to run in background
- [ ] Set up Airflow executor: LocalExecutor for single-node (or CeleryExecutor for distributed)
- [ ] Configure email notifications on DAG failure
- [ ] Set up Airflow user with Webserver access

**Step 2: Add Data Quality Checks**
- [ ] Implement null/completeness checks in validation.py
- [ ] Add outlier detection (flag unusual values)
- [ ] Add data freshness checks (ensure timely extraction)
- [ ] Create alert logic for failed validations

**Step 3: Enhance Predict Phase**
- [ ] Implement ML models (sklearn, TensorFlow)
  - Patient readmission risk scoring
  - Revenue forecasting
  - Medicine demand prediction
- [ ] Score predictions and store in analytics tables
- [ ] Create ML model versioning

**Step 4: Set Up ETL Monitoring**
- [ ] CloudWatch metrics for ETL execution time
- [ ] SNS alerts for DAG failures
- [ ] Airflow task logs in CloudWatch Logs
- [ ] Dashboard showing daily ETL status

**Deliverables:**
- Airflow running daily on schedule
- Data quality issues detected automatically
- ML predictions integrated into analytics
- Monitoring and alerting configured

---

### Phase 4: Production Hardening (2-3 days)

**Step 1: Database Hardening**
- [ ] Enable RDS Multi-AZ (automatic failover)
- [ ] Enable automated backups (30-day retention)
- [ ] Enable encryption at rest (KMS)
- [ ] Enable encryption in transit (SSL)
- [ ] Create read replica for analytics queries
- [ ] Set up backup/restore procedures

**Step 2: High Availability**
- [ ] Set up Application Load Balancer (ALB)
- [ ] Create EC2 Auto Scaling Group
  - Target: 2 instances minimum (multi-AZ)
  - Scaling: Based on CPU/Memory utilization
- [ ] Configure health checks
- [ ] Set up SSL/TLS certificates (ACM)

**Step 3: Security**
- [ ] Use AWS Secrets Manager for credentials
- [ ] Set up AWS WAF on ALB
- [ ] Enable VPC Flow Logs
- [ ] Set up Security Hub for compliance
- [ ] Configure IAM roles (least privilege)
- [ ] Enable MFA for AWS Console access

**Step 4: Logging & Monitoring**
- [ ] Centralize logs: CloudWatch Logs
- [ ] Set up X-Ray tracing for requests
- [ ] Create CloudWatch dashboards
- [ ] Set up SNS topics for critical alerts
- [ ] Create PagerDuty/Slack integrations

**Deliverables:**
- Multi-AZ database with automatic failover
- Load-balanced EC2 instances with auto-scaling
- SSL/TLS encryption for all traffic
- Centralized logging and monitoring
- Security compliance enabled

---

## 🎯 RECOMMENDED NEXT STEPS (No Code Changes Yet)

### **Immediate (This Week)**

1. **AWS Account Setup**
   - Create AWS account
   - Configure IAM roles
   - Set up billing alerts
   - **Time: 1-2 hours**

2. **Gather Deployment Parameters**
   - Decide on AWS region (us-east-1, eu-west-1, etc.)
   - Choose EC2 instance types and counts
   - Decide on backup retention policies
   - Create documentation of parameters
   - **Time: 1-2 hours**

3. **Prepare Deployment Runbook**
   - Create step-by-step AWS deployment guide
   - Document template parameters
   - Create rollback procedures
   - **Time: 2-3 hours**

### **Short Term (This Month)**

1. **AWS Infrastructure Deployment**
   - Deploy VPC, RDS, EC2, S3, CloudFront
   - Validate all components functioning
   - Document endpoint URLs
   - **Time: 2-3 days**

2. **Activate CI/CD Pipeline**
   - Set up GitHub repository
   - Configure GitHub Secrets
   - Test deployment pipeline
   - Fix any deployment issues
   - **Time: 1-2 days**

3. **ETL Optimization**
   - Test full ETL pipeline on AWS
   - Optimize extraction queries
   - Add data quality checks
   - **Time: 1-2 days**

### **Medium Term (Next Month)**

1. **Production Hardening**
   - Enable Multi-AZ for RDS
   - Set up Auto Scaling
   - Configure ALB
   - Enable SSL/TLS
   - **Time: 3-5 days**

2. **Monitoring & Alerts**
   - CloudWatch dashboards
   - SNS/Slack integrations
   - Log centralization
   - **Time: 2-3 days**

3. **Disaster Recovery**
   - Backup strategy
   - Restore procedures
   - Failover testing
   - **Time: 2-3 days**

---

## 📊 Current vs. Target State

| Component | Current | Target (AWS) | Gap |
|-----------|---------|--------------|-----|
| **Database** | Docker (local) | RDS PostgreSQL (Multi-AZ) | Managed service, HA |
| **Backend API** | Docker (local) | EC2 (Auto-scaled, ALB) | Horizontal scaling, HA |
| **Frontend** | Docker (local) | S3 + CloudFront | Global CDN, low latency |
| **ETL** | Airflow (local) | Airflow on EC2 + S3 for data | Scalable, auditable |
| **CI/CD** | GitHub Actions (defined) | Deployed to AWS | Production automation |
| **Logging** | Console/Files | CloudWatch | Centralized, searchable |
| **Monitoring** | None | CloudWatch + Alarms | Proactive alerting |
| **Backups** | Manual | Automated RDS backups | RPO/RTO guaranteed |
| **Security** | Basic | WAF, encryption, Secrets Mgr | Compliance-ready |

---

## 🔑 Key Success Factors

1. **Infrastructure as Code (IaC)**
   - ✅ CloudFormation templates exist
   - Next: Organize into stacks (networking, database, compute)

2. **Automated Deployments**
   - ✅ GitHub Actions pipeline defined
   - Next: Activate with EC2 targets

3. **Data Pipeline Reliability**
   - ✅ ETL DAG tested locally
   - Next: Move to AWS, add monitoring

4. **Cost Optimization**
   - Use t3.small/t3.micro for non-prod
   - Use t3.medium for production
   - RDS on-demand for dev, reserved for prod
   - CloudFront for static content (cost-effective at scale)

---

## 📝 SUMMARY

### ✅ What's Already Done
- ETL pipeline fully implemented (extract → transform → load → predict)
- CloudFormation templates for AWS infrastructure
- GitHub Actions CI/CD pipeline
- Local Docker deployment working
- Application code production-ready

### ⚠️ What's Partially Done
- AWS templates not deployed (still in code)
- CI/CD configured but secrets not set up
- ETL running locally only (needs AWS RDS setup)
- Monitoring/alerting not configured

### ❌ What's Not Started
- AWS account setup
- Production hardening (HA, Multi-AZ)
- Disaster recovery procedures
- Cost optimization analysis

### 🎯 Recommended Priority
1. **AWS Infrastructure** (foundation)
2. **CI/CD Activation** (automation)
3. **ETL on AWS** (data pipeline)
4. **Production Hardening** (reliability)
5. **Monitoring** (visibility)

---

**Next Session:** Ready to implement AWS deployment when you decide to proceed. All groundwork done, just needs activation and configuration.
