# AWS & DevOps Implementation Checklist & Architecture

## 🏗️ HIGH-LEVEL AWS ARCHITECTURE

### Local Development Environment (Current)
```
Developer Laptop
├── Docker Desktop
│   ├── PostgreSQL (port 5432)
│   ├── Node.js Backend (port 5000)
│   ├── React Frontend (port 80)
│   └── Airflow (port 8080)
├── Git
└── GitHub (code repository)
```

### AWS Production Environment (Target)
```
AWS Account (Production)
│
├── VPC (10.0.0.0/16)
│   ├── Public Subnets (10.0.1.0/24, 10.0.2.0/24)
│   │   ├── Application Load Balancer (ALB)
│   │   ├── NAT Gateway
│   │   └── EC2 Auto Scaling Group
│   │       ├── Backend API Instances (docker-compose)
│   │       └── Airflow Instances (ETL)
│   │
│   └── Private Subnet (10.0.3.0/24)
│       └── RDS PostgreSQL (Multi-AZ)
│           ├── SHMS Database
│           └── Analytics Database
│
├── Storage
│   ├── S3 (static frontend assets)
│   ├── S3 (ETL raw data)
│   └── S3 (ETL processed data)
│
├── Content Delivery
│   └── CloudFront (CDN for frontend)
│
├── Monitoring & Logging
│   ├── CloudWatch (logs, metrics)
│   ├── X-Ray (tracing)
│   └── SNS (alerts)
│
├── Security
│   ├── Secrets Manager (credentials)
│   ├── WAF (web firewall)
│   └── Security Groups (network)
│
├── Database Backups
│   ├── RDS Backups (automated)
│   └── Snapshots (manual)
│
└── CI/CD Pipeline
    └── GitHub Actions → ECR → ECS/EC2
```

---

## 📋 IMPLEMENTATION CHECKLIST

### ✅ Phase 0: Prerequisites (Before Any Deployment)

- [ ] **AWS Account Ready**
  - [ ] AWS account created
  - [ ] Billing enabled and alerts set
  - [ ] Root account MFA enabled
  - [ ] IAM user created for deployments

- [ ] **Local Setup Complete**
  - [ ] Docker Desktop installed and running
  - [ ] docker-compose tested locally
  - [ ] All tests passing (`npm test`)
  - [ ] `.env` file properly configured

- [ ] **GitHub Repository Setup**
  - [ ] Repository created and initialized
  - [ ] All code committed to main/develop
  - [ ] `.github/workflows/main.yml` in place
  - [ ] Branch protection rules configured (main requires PR review)

- [ ] **AWS CLI Configured**
  - [ ] AWS CLI installed
  - [ ] Credentials configured: `aws configure`
  - [ ] Test: `aws s3 ls` returns bucket list
  - [ ] AWS region selected (e.g., us-east-1)

---

### 🔧 Phase 1: AWS Infrastructure Setup (2-3 days)

#### **1.1 VPC & Networking**
- [ ] **Deploy VPC Stack**
  ```bash
  aws cloudformation create-stack \
    --stack-name shms-vpc \
    --template-body file://infrastructure/aws/vpc.yaml
  ```
  - [ ] Stack creation successful
  - [ ] VPC ID noted
  - [ ] Public Subnet IDs noted
  - [ ] Private Subnet IDs noted
  - [ ] Internet Gateway verified
  - [ ] NAT Gateway verified

- [ ] **Networking Tests**
  - [ ] Route table rules verified
  - [ ] DNS resolution working
  - [ ] Security group rules correct
  - [ ] Network ACLs permissive enough

#### **1.2 RDS Database**
- [ ] **Set Up Database Credentials**
  - [ ] Create random password (32+ chars)
  - [ ] Store in password manager
  - [ ] Create AWS Secrets Manager secret

- [ ] **Deploy RDS Stack**
  ```bash
  aws cloudformation create-stack \
    --stack-name shms-rds \
    --template-body file://infrastructure/aws/rds.yaml \
    --parameters \
      ParameterKey=VpcId,ParameterValue=vpc-xxx \
      ParameterKey=Subnet1Id,ParameterValue=subnet-xxx \
      ParameterKey=Subnet2Id,ParameterValue=subnet-yyy \
      ParameterKey=DBPassword,ParameterValue=YourSecurePassword
  ```
  - [ ] RDS instance created
  - [ ] RDS endpoint captured: `shms-database.xxxxx.rds.amazonaws.com`
  - [ ] Database port 5432 accessible from EC2 SG
  - [ ] Backup retention set to 30 days
  - [ ] Encryption enabled

- [ ] **Database Initialization**
  - [ ] Test connection from EC2:
    ```bash
    psql -h shms-database.xxxxx.rds.amazonaws.com \
         -U shms_admin \
         -d shms
    ```
  - [ ] Sequelize migrations run
  - [ ] Database seeded with initial data
  - [ ] Tables verified with `\dt` command

#### **1.3 EC2 Backend Instance**
- [ ] **Update EC2 Template**
  - [ ] Modify `infrastructure/aws/ec2-backend.yaml`
  - [ ] Add RDS endpoint to UserData
  - [ ] Add docker-compose pull command to UserData
  - [ ] Add environment variables setup

- [ ] **Deploy EC2 Stack**
  ```bash
  aws cloudformation create-stack \
    --stack-name shms-backend \
    --template-body file://infrastructure/aws/ec2-backend.yaml \
    --parameters \
      ParameterKey=VpcId,ParameterValue=vpc-xxx \
      ParameterKey=SubnetId,ParameterValue=subnet-xxx
  ```
  - [ ] EC2 instance launched
  - [ ] Public IP assigned and captured
  - [ ] Security group allows SSH (port 22)
  - [ ] Security group allows HTTP (port 80)

- [ ] **EC2 Configuration**
  - [ ] SSH into instance: `ssh -i key.pem ec2-user@{public-ip}`
  - [ ] Clone repository: `git clone https://github.com/you/shms.git`
  - [ ] Create `.env` file with:
    - DATABASE_URL pointing to RDS
    - AI provider keys (Groq, OpenAI)
    - JWT secrets
  - [ ] Start services:
    ```bash
    cd ~/shms
    docker-compose pull
    docker-compose up -d
    ```
  - [ ] Services verify:
    ```bash
    docker ps  # All services running
    curl http://localhost:5000/health  # Backend responds
    curl http://localhost:8080  # Airflow responds
    ```

#### **1.4 S3 & CloudFront Frontend**
- [ ] **Deploy CloudFront Stack**
  ```bash
  aws cloudformation create-stack \
    --stack-name shms-frontend \
    --template-body file://infrastructure/aws/frontend-cloudfront.yaml
  ```
  - [ ] S3 bucket created
  - [ ] CloudFront distribution created
  - [ ] Distribution domain name captured

- [ ] **Deploy Frontend**
  - [ ] Build frontend: `cd frontend && npm run build`
  - [ ] Upload to S3:
    ```bash
    aws s3 sync dist/ s3://shms-frontend-bucket/ --delete
    ```
  - [ ] Test CloudFront URL in browser
  - [ ] Verify assets load (CSS, JS, images)
  - [ ] Check browser console for CORS errors

- [ ] **Backend Configuration**
  - [ ] Update CORS in backend to allow CloudFront domain
  - [ ] Redeploy backend: `docker-compose up -d --force-recreate backend`

#### **1.5 Infrastructure Validation**
- [ ] **Connectivity Tests**
  - [ ] Backend responds to HTTP: `curl http://{ec2-ip}:5000/health`
  - [ ] Frontend loads: Browser → CloudFront URL
  - [ ] Database accessible from EC2
  - [ ] Airflow webserver responds: `curl http://{ec2-ip}:8080`

- [ ] **Data Tests**
  - [ ] Login to frontend with demo credentials
  - [ ] Create a patient (verifies API + DB)
  - [ ] Query patient (verifies retrieval)
  - [ ] Run ETL manually and check results

---

### 🔄 Phase 2: CI/CD Pipeline Activation (1-2 days)

#### **2.1 GitHub Configuration**
- [ ] **Repository Settings**
  - [ ] Go to Settings → Environments
  - [ ] Create `development` environment
  - [ ] Create `production` environment
  - [ ] Configure environment protection rules

#### **2.2 Docker Registry Setup**
- [ ] **DockerHub Account**
  - [ ] Create DockerHub account (free tier OK)
  - [ ] Create access token (Settings → Personal Access Tokens)
  - [ ] Save username and token

- [ ] **GitHub Secrets Configuration**
  ```
  Settings → Secrets and variables → Actions
  ```
  - [ ] Add `DOCKERHUB_USERNAME`
  - [ ] Add `DOCKERHUB_TOKEN`

#### **2.3 Development Environment Secrets**
- [ ] **EC2 Dev Instance**
  - [ ] Launch EC2 instance (same as prod setup)
  - [ ] Assign elastic IP
  - [ ] Copy public IP: `{EC2_HOST_DEV}`

- [ ] **SSH Key Setup**
  - [ ] Generate SSH key: `ssh-keygen -t rsa -b 4096 -f shms-deploy-key`
  - [ ] Add public key to EC2 authorized_keys
  - [ ] Extract private key in PEM format
  - [ ] Add to GitHub secrets:
    - [ ] `EC2_HOST_DEV` = {public-ip}
    - [ ] `EC2_USER_DEV` = `ec2-user` or `ubuntu`
    - [ ] `EC2_SSH_KEY_DEV` = {private-key content}

#### **2.4 Production Environment Secrets**
- [ ] **EC2 Prod Instance**
  - [ ] Launch production EC2 instance
  - [ ] Assign elastic IP
  - [ ] Copy public IP: `{EC2_HOST_PROD}`

- [ ] **SSH Key Setup (Production)**
  - [ ] Generate separate SSH key: `ssh-keygen -t rsa -b 4096 -f shms-deploy-prod-key`
  - [ ] Add public key to prod EC2
  - [ ] Add to GitHub secrets:
    - [ ] `EC2_HOST_PROD` = {public-ip}
    - [ ] `EC2_USER_PROD` = `ec2-user` or `ubuntu`
    - [ ] `EC2_SSH_KEY_PROD` = {private-key content}

#### **2.5 Test CI/CD Pipeline**
- [ ] **Test Development Deployment**
  - [ ] Make a commit to `develop` branch
  - [ ] Go to GitHub Actions tab
  - [ ] Watch workflow execute:
    - [ ] Test stage passes
    - [ ] Build stage completes
    - [ ] Images pushed to DockerHub
    - [ ] Deploy-dev stage runs
    - [ ] SSH succeeds
    - [ ] docker-compose pull succeeds
    - [ ] docker-compose up -d succeeds
    - [ ] Health check passes

- [ ] **Verify Dev Deployment**
  - [ ] SSH into dev EC2: `ssh -i key.pem ec2-user@{dev-ip}`
  - [ ] Check containers: `docker ps`
  - [ ] Verify latest image pulled: `docker images | grep shms`
  - [ ] Test backend: `curl http://localhost:5000/health`

- [ ] **Test Production Deployment**
  - [ ] Make a commit to `main` branch
  - [ ] Watch GitHub Actions execute
  - [ ] All stages pass
  - [ ] Health check succeeds
  - [ ] Verify prod EC2 has latest images

#### **2.6 CI/CD Verification Checklist**
- [ ] Docker images appear in DockerHub
- [ ] Image tags follow convention: `{env}-{short-sha}`
- [ ] Development deployments happen on `develop` push
- [ ] Production deployments happen on `main` push
- [ ] Zero-downtime deployment (no service interruption)
- [ ] Rollback possible (previous image still in DockerHub)

---

### 📊 Phase 3: ETL on AWS (1-2 days)

#### **3.1 Airflow Setup**
- [ ] **Airflow Database**
  - [ ] Airflow uses RDS PostgreSQL (already set up)
  - [ ] Airflow scheduler running on EC2
  - [ ] Airflow webserver accessible on port 8080

- [ ] **ETL Data Storage**
  - [ ] Create S3 bucket for ETL data:
    ```bash
    aws s3 mb s3://shms-etl-data
    ```
  - [ ] Create folders: `raw/`, `processed/`
  - [ ] Verify S3 paths in Airflow config

#### **3.2 DAG Testing**
- [ ] **Manual DAG Execution**
  - [ ] Access Airflow webserver: `http://{ec2-ip}:8080`
  - [ ] Login with Airflow credentials
  - [ ] Find DAG: `shms_daily_analytics_etl`
  - [ ] Trigger manually (button or CLI)
  - [ ] Monitor task execution
  - [ ] Verify all tasks pass:
    - [ ] extract_data ✅
    - [ ] transform_data ✅
    - [ ] load_data ✅
    - [ ] run_predictions ✅

- [ ] **Data Verification**
  - [ ] Check S3 for extracted CSVs: `aws s3 ls s3://shms-etl-data/raw/`
  - [ ] Check S3 for processed CSVs: `aws s3 ls s3://shms-etl-data/processed/`
  - [ ] Query analytics tables in RDS:
    ```sql
    SELECT COUNT(*) FROM daily_revenue_analytics;
    SELECT COUNT(*) FROM patient_trends_analytics;
    ```

#### **3.3 Scheduler Configuration**
- [ ] **Enable Daily Scheduling**
  - [ ] Set environment: `ETL_MODE=production`
  - [ ] Schedule: `0 0 * * *` (midnight daily)
  - [ ] Verify in Airflow UI

- [ ] **Monitoring**
  - [ ] View DAG run history
  - [ ] Check task logs for errors
  - [ ] Set up email alerts for failures (optional)

---

### 🔒 Phase 4: Production Hardening (2-3 days)

#### **4.1 Database High Availability**
- [ ] **Enable Multi-AZ**
  - [ ] Modify RDS instance
  - [ ] Enable Multi-AZ
  - [ ] Configure failover time: ~2 minutes

- [ ] **Automated Backups**
  - [ ] Backup retention: 30 days (AWS default)
  - [ ] Backup window: 03:00-04:00 UTC
  - [ ] Test restore procedure (document)

- [ ] **Read Replica (Optional)**
  - [ ] Create read replica in same AZ
  - [ ] Use for analytics queries (offload main DB)
  - [ ] Update ETL to read from replica

- [ ] **Encryption**
  - [ ] Enable encryption at rest (KMS)
  - [ ] Enable encryption in transit (SSL)
  - [ ] Update connection strings with SSL certificates

#### **4.2 Application High Availability**
- [ ] **Load Balancer Setup**
  - [ ] Create Application Load Balancer (ALB)
  - [ ] Target group: EC2 instances running backend
  - [ ] Health check: `GET /health`
  - [ ] Configure sticky sessions (if needed)

- [ ] **Auto Scaling Group**
  - [ ] Create launch template (from EC2 instance)
  - [ ] Create Auto Scaling group
    - [ ] Min instances: 2 (multi-AZ for HA)
    - [ ] Max instances: 4 (cost control)
    - [ ] Desired: 2
  - [ ] Scaling policy: CPU > 70% → scale up
  - [ ] Test scaling behavior

- [ ] **SSL/TLS Certificate**
  - [ ] Request certificate in AWS Certificate Manager
  - [ ] Validate domain ownership
  - [ ] Attach to ALB listener (port 443)
  - [ ] Redirect HTTP → HTTPS

#### **4.3 Security Hardening**
- [ ] **AWS Secrets Manager**
  - [ ] Move all secrets to Secrets Manager
  - [ ] Update EC2 IAM role to read secrets
  - [ ] Remove hardcoded secrets from EC2

- [ ] **Web Application Firewall (WAF)**
  - [ ] Create WAF rules for ALB
  - [ ] Rule 1: Rate limiting (100 req/5min per IP)
  - [ ] Rule 2: SQL injection protection
  - [ ] Rule 3: XSS protection
  - [ ] Rule 4: IP reputation filtering

- [ ] **Security Groups**
  - [ ] Backend SG: Allow from ALB only (not from internet)
  - [ ] ALB SG: Allow 80/443 from internet
  - [ ] RDS SG: Allow 5432 from backend SG only

- [ ] **IAM Roles**
  - [ ] EC2 role has only needed permissions
  - [ ] Read RDS only (not delete)
  - [ ] Read S3 only
  - [ ] Write CloudWatch Logs

#### **4.4 DNS & Domain**
- [ ] **Route 53 Setup**
  - [ ] Create hosted zone for domain
  - [ ] Add A record → ALB DNS name
  - [ ] Update domain registrar nameservers
  - [ ] Verify DNS resolution: `nslookup yourdomain.com`

- [ ] **Health Checks**
  - [ ] Create Route 53 health check for ALB
  - [ ] CloudWatch alarm on health check failure
  - [ ] SNS notification to ops team

---

### 📊 Phase 5: Monitoring & Alerts (1-2 days)

#### **5.1 CloudWatch Setup**
- [ ] **Application Logs**
  - [ ] Backend logs → CloudWatch Logs Group: `/shms/backend`
  - [ ] Airflow logs → CloudWatch Logs Group: `/shms/airflow`
  - [ ] RDS logs → CloudWatch Logs Group: `/shms/database`

- [ ] **Metrics Collection**
  - [ ] EC2 CPU, Memory, Disk (CloudWatch agent)
  - [ ] RDS CPU, Storage, Connections
  - [ ] ALB requests, latency, errors
  - [ ] Docker container metrics

- [ ] **CloudWatch Dashboard**
  - [ ] Create dashboard with key metrics:
    - [ ] API latency (p50, p99)
    - [ ] Database connections
    - [ ] Error rates (4xx, 5xx)
    - [ ] ETL execution time
    - [ ] RDS CPU/Storage
    - [ ] Auto Scaling group size

#### **5.2 Alarms**
- [ ] **Application Alarms**
  - [ ] [ ] Backend health check failing → SNS
  - [ ] [ ] API error rate > 5% → SNS
  - [ ] [ ] API latency p99 > 2s → SNS

- [ ] **Database Alarms**
  - [ ] [ ] CPU > 80% → SNS
  - [ ] [ ] Storage > 90% → SNS
  - [ ] [ ] Read latency > 100ms → SNS
  - [ ] [ ] Connection count > 80% → SNS

- [ ] **Infrastructure Alarms**
  - [ ] [ ] ASG health check fail → SNS
  - [ ] [ ] EC2 status check fail → SNS
  - [ ] [ ] NAT Gateway errors → SNS

- [ ] **ETL Alarms**
  - [ ] [ ] DAG failure → SNS
  - [ ] [ ] ETL execution time > 5min → SNS
  - [ ] [ ] Data quality check fail → SNS

#### **5.3 Notifications**
- [ ] **SNS Topics**
  - [ ] Create topic: `shms-critical-alerts`
  - [ ] Create topic: `shms-warning-alerts`
  - [ ] Create topic: `shms-info-alerts`

- [ ] **Subscribers**
  - [ ] Email: ops-team@company.com
  - [ ] Slack webhook (via Lambda)
  - [ ] PagerDuty (via integration)

#### **5.4 X-Ray Tracing**
- [ ] **Enable X-Ray**
  - [ ] Add X-Ray middleware to Express app
  - [ ] Update EC2 IAM role for X-Ray write
  - [ ] Create X-Ray service map visualization
  - [ ] Track request latency end-to-end

---

### 📋 Phase 6: Final Verification (1 day)

#### **6.1 End-to-End Testing**
- [ ] **Frontend to Backend Flow**
  - [ ] Load frontend from CloudFront
  - [ ] Login with test user
  - [ ] Create patient (API + DB write)
  - [ ] List patients (API + DB read)
  - [ ] Delete patient (API + DB delete)
  - [ ] All requests complete < 500ms

- [ ] **ETL Flow**
  - [ ] Manually trigger DAG
  - [ ] All tasks complete successfully
  - [ ] Data appears in analytics tables
  - [ ] Analytics dashboard shows data

- [ ] **Failover Testing**
  - [ ] Simulate EC2 failure: stop instance
  - [ ] ASG launches replacement
  - [ ] ALB routes to healthy instance
  - [ ] Zero downtime
  - [ ] Restart stopped instance

#### **6.2 Performance Testing**
- [ ] **Load Testing**
  - [ ] Tool: Apache JMeter or AWS Load Testing
  - [ ] Simulate 100 concurrent users
  - [ ] Monitor response times
  - [ ] Verify ASG scales up
  - [ ] Verify scale down after load

- [ ] **Stress Testing**
  - [ ] Simulate 500 concurrent users
  - [ ] Expected: Some requests queue/timeout
  - [ ] System should not crash
  - [ ] Monitor alerts

#### **6.3 Security Testing**
- [ ] **HTTPS Verification**
  - [ ] All connections encrypted
  - [ ] Certificate valid and current
  - [ ] No mixed content warnings

- [ ] **SQL Injection Test**
  - [ ] Input: `' OR '1'='1`
  - [ ] Result: Safely rejected (WAF or app)

- [ ] **CORS Verification**
  - [ ] CloudFront domain can call API
  - [ ] Other domains blocked

#### **6.4 Backup/Restore Testing**
- [ ] **Database Backup**
  - [ ] Verify RDS backup exists
  - [ ] Restore to point in time
  - [ ] Verify data integrity
  - [ ] Document procedure

- [ ] **Application Backup**
  - [ ] Verify docker images in ECR/DockerHub
  - [ ] Verify git tags for releases
  - [ ] Verify rollback procedure

#### **6.5 Documentation**
- [ ] Runbook for common operations
  - [ ] How to scale EC2 instances
  - [ ] How to backup database
  - [ ] How to restore from backup
  - [ ] How to deploy new version
  - [ ] How to rollback deployment

- [ ] Incident response procedures
  - [ ] Database down → steps
  - [ ] API latency high → diagnosis
  - [ ] ETL failed → investigation
  - [ ] DDoS attack → mitigation

---

## 🎯 SUCCESS CRITERIA

### All Phases Complete ✅

| Criterion | Status | Verification |
|-----------|--------|--------------|
| Frontend loads from CloudFront | ✅ | HTTP 200, < 2s latency |
| Backend API responds | ✅ | curl http://alb-dns/health |
| Database Multi-AZ | ✅ | AWS Console shows Multi-AZ enabled |
| Automated deployments | ✅ | git push → AWS update (no manual steps) |
| ETL runs daily | ✅ | Airflow shows DAG execution history |
| Monitoring active | ✅ | CloudWatch dashboards show metrics |
| Logs centralized | ✅ | CloudWatch Logs contains all logs |
| Alerts configured | ✅ | SNS receives test notification |
| SSL/TLS enabled | ✅ | HTTPS only, no mixed content |
| Backups automated | ✅ | RDS shows recent backup |
| ASG working | ✅ | Scale up/down on demand |
| Zero downtime deploy | ✅ | No requests dropped during deploy |

---

## 📞 Support & Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| EC2 won't connect | SG rules wrong | Allow SSH from your IP |
| RDS connection denied | Wrong password | Verify credentials in .env |
| Docker pull fails | No internet | Check NAT gateway |
| CloudFront 403 | S3 policy wrong | Verify bucket policy |
| ETL fails | Missing tables | Run Sequelize migrations first |
| Deployment hangs | SSH key issues | Test: `ssh -i key.pem user@host` |
| High latency | RDS CPU high | Enable read replica, optimize queries |

---

Generated: June 29, 2026
Version: 1.0
