# SHMS AWS Free Tier Deployment Guide

This guide deploys SHMS using simple, viva-friendly AWS infrastructure:
- VPC + public/private subnets
- EC2 (Dockerized backend + frontend)
- RDS PostgreSQL
- S3 (frontend assets + patient documents)
- CloudFront
- CloudWatch alarms/log groups
- Optional Lambda reminder trigger

## 1. Prerequisites
- AWS account with free-tier eligibility
- AWS CLI configured (`aws configure`)
- A created EC2 key pair in your region
- DockerHub images already pushed:
  - `shms-backend`
  - `shms-frontend`
- Local Node.js/npm installed (for frontend publish script)

## 2. Deploy Infrastructure
Run from repository root:

```powershell
cd infrastructure/aws
.\deploy-free-tier.ps1 \
  -StackPrefix shms-demo \
  -Region us-east-1 \
  -KeyPairName <your-keypair-name> \
  -DBUser shms_admin \
  -DBPassword <strong-db-password> \
  -DockerHubUsername <your-dockerhub-username> \
  -BackendImageTag latest \
  -FrontendImageTag latest \
  -AllowedSshCidr <your-public-ip>/32
```

What this script does:
1. Deploys [infrastructure/aws/vpc.yaml](../infrastructure/aws/vpc.yaml)
2. Deploys [infrastructure/aws/frontend-cloudfront.yaml](../infrastructure/aws/frontend-cloudfront.yaml)
3. Deploys [infrastructure/aws/rds.yaml](../infrastructure/aws/rds.yaml)
4. Deploys [infrastructure/aws/ec2-backend.yaml](../infrastructure/aws/ec2-backend.yaml)
5. Tightens RDS ingress to backend security group after EC2 is created

## 3. Publish React Frontend to S3 + CloudFront
The EC2-hosted frontend works immediately, but for CloudFront demo use S3 static hosting path:

```powershell
cd infrastructure/aws
.\publish-frontend.ps1 \
  -BucketName <frontend-bucket-name> \
  -DistributionId <cloudfront-distribution-id> \
  -Region us-east-1
```

## 4. Optional Reminder Lambda
Deploy optional scheduled reminder trigger:

```powershell
aws cloudformation deploy \
  --stack-name shms-demo-reminder \
  --template-file infrastructure/aws/lambda.yaml \
  --region us-east-1 \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    EnableReminderLambda=true \
    ReminderScheduleExpression="cron(0 8 * * ? *)" \
    ReminderApiUrl="http://<ec2-public-ip>:5000/api/agent/run/follow-up" \
    ReminderApiToken="<optional-token>"
```

If you do not need this for viva, keep `EnableReminderLambda=false`.

## 5. Free-Tier Safety
- Use `t2.micro`/`t3.micro` only.
- Use one RDS instance (`db.t3.micro`) and keep storage low.
- Use CloudFront `PriceClass_100`.
- Avoid NAT Gateway and load balancers.
- Set billing alarms and AWS Budgets.

## 6. GitHub Actions Integration
Use [docs/CI_CD_PIPELINE_RUNBOOK.md](CI_CD_PIPELINE_RUNBOOK.md).
- CI runs without EC2 secrets.
- Deploy jobs run only when EC2 secrets exist and branch/deploy target matches.

Runtime secret handling on AWS:
- Do not copy `backend/.env` into Docker images.
- Pass runtime config through deployment parameters and container runtime environment.
- Restrict SSH CIDR and rotate credentials regularly for demos that run longer than a day.

## 7. Demo Narrative
For viva, explain:
1. Local development uses Docker Compose.
2. CI validates backend/frontend tests and builds.
3. CD deploys Dockerized app to EC2.
4. Production-grade static delivery is demonstrated using S3 + CloudFront.
5. Patient documents are stored in S3 with backend IAM role access.
