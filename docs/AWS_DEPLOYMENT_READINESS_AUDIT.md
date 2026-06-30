# SHMS AWS Deployment Readiness Audit (Repository-Based)

Date: 2026-07-01
Scope: repository evidence only
Assumption: nothing is deployed in AWS yet

## Evidence Baseline
- CI/CD workflow: [.github/workflows/main.yml](../.github/workflows/main.yml)
- VPC IaC: [infrastructure/aws/vpc.yaml](../infrastructure/aws/vpc.yaml)
- EC2 IaC: [infrastructure/aws/ec2-backend.yaml](../infrastructure/aws/ec2-backend.yaml)
- RDS IaC: [infrastructure/aws/rds.yaml](../infrastructure/aws/rds.yaml)
- S3 and CloudFront IaC: [infrastructure/aws/frontend-cloudfront.yaml](../infrastructure/aws/frontend-cloudfront.yaml)
- Lambda IaC: [infrastructure/aws/lambda.yaml](../infrastructure/aws/lambda.yaml)
- Backend S3 runtime usage: [backend/src/services/storageService.js](../backend/src/services/storageService.js)
- Backend Bedrock runtime usage: [backend/src/services/aiService.js](../backend/src/services/aiService.js)
- Backend env examples: [backend/.env.example](../backend/.env.example)

No CloudFormation stack outputs, deployment state, terraform state, or inventory exports are committed in the repo. Therefore every AWS resource is treated as not deployed.

## Global Required GitHub Secrets (for successful GitHub Actions deployment)
- DOCKERHUB_USERNAME
- DOCKERHUB_TOKEN
- EC2_HOST_DEV
- EC2_USER_DEV
- EC2_SSH_KEY_DEV
- EC2_HOST_PROD
- EC2_USER_PROD
- EC2_SSH_KEY_PROD

## Global Backend Runtime Environment Variables (EC2/Docker runtime)
- NODE_ENV=production
- DATABASE_URL=postgresql://<user>:<password>@<rds-endpoint>:5432/shms
- AWS_REGION=<region>
- AWS_S3_BUCKET=<patient-documents-bucket>
- JWT_SECRET
- JWT_REFRESH_SECRET
- JWT_EXPIRES_IN
- JWT_REFRESH_EXPIRES_IN
- GROQ_API_KEY (if using Groq)
- Optional Bedrock path: AI_PROVIDER=bedrock and BEDROCK_MODEL_ID

## Service-by-Service Audit

### 1. VPC
1. IaC exists: Yes ([infrastructure/aws/vpc.yaml](../infrastructure/aws/vpc.yaml))
2. Runtime code uses service: Indirectly (network foundation only)
3. Manual AWS setup required: Yes
4. Exact setup steps:
   - Console:
     - CloudFormation -> Create stack -> Upload [infrastructure/aws/vpc.yaml](../infrastructure/aws/vpc.yaml)
     - Stack name: shms-vpc
     - Keep default CIDRs or customize
     - Create stack and wait for CREATE_COMPLETE
   - CLI:
     - aws cloudformation deploy --stack-name shms-vpc --template-file infrastructure/aws/vpc.yaml --region <region>
     - aws cloudformation describe-stacks --stack-name shms-vpc --region <region>
5. GitHub Secrets required: None directly
6. Environment variables required: None directly
7. Dependencies: AWS account, permissions for CloudFormation/EC2
8. Verification:
   - VPC, 2 public subnets, 2 private subnets exist
   - Outputs include VpcId, PublicSubnet1, PublicSubnet2, PrivateSubnet1, PrivateSubnet2

### 2. IAM
1. IaC exists: Partial
   - EC2 instance role and S3 access policy are in [infrastructure/aws/ec2-backend.yaml](../infrastructure/aws/ec2-backend.yaml)
   - Lambda role is in [infrastructure/aws/lambda.yaml](../infrastructure/aws/lambda.yaml)
2. Runtime code uses service: Yes (EC2 role for S3 access path)
3. Manual AWS setup required: Yes
4. Exact setup steps:
   - Console:
     - Verify CloudFormation-created role SHMS EC2 role has S3 access to documents bucket
     - Verify Lambda execution role exists when Lambda is enabled
     - Optionally create least-privilege role for GitHub OIDC (future hardening)
   - CLI:
     - aws iam list-roles
     - aws iam get-role --role-name <role-name>
     - aws iam list-attached-role-policies --role-name <role-name>
5. GitHub Secrets required: None for IAM directly (current workflow uses SSH keys, not AWS API credentials)
6. Environment variables required: None directly
7. Dependencies: EC2 stack, Lambda stack, S3 bucket names
8. Verification:
   - EC2 instance profile attached to instance
   - S3 put/get/list allowed only on patient-documents bucket

### 3. RDS (PostgreSQL)
1. IaC exists: Yes ([infrastructure/aws/rds.yaml](../infrastructure/aws/rds.yaml))
2. Runtime code uses service: Yes (backend DB via DATABASE_URL in [backend/src/utils/databaseUrl.js](../backend/src/utils/databaseUrl.js))
3. Manual AWS setup required: Yes
4. Exact setup steps:
   - Console:
     - CloudFormation -> create stack from [infrastructure/aws/rds.yaml](../infrastructure/aws/rds.yaml)
     - Provide VpcId, PrivateSubnet1Id, PrivateSubnet2Id, DBUser, DBPassword
     - Keep PubliclyAccessible=false
   - CLI:
     - aws cloudformation deploy --stack-name shms-rds --template-file infrastructure/aws/rds.yaml --region <region> --parameter-overrides VpcId=<vpc-id> VpcCidr=10.20.0.0/16 PrivateSubnet1Id=<subnet-1> PrivateSubnet2Id=<subnet-2> DBName=shms DBUser=<db-user> DBPassword=<db-password> BackendSecurityGroupId=
5. GitHub Secrets required: None directly in current workflow
6. Environment variables required:
   - DATABASE_URL on EC2 runtime
7. Dependencies:
   - VPC private subnets
   - Backend security group (tighten ingress after EC2 creation)
8. Verification:
   - RDS status is Available
   - Connect from EC2 host to RDS endpoint:5432
   - Backend health endpoint returns healthy after migrations/seeding

### 4. EC2
1. IaC exists: Yes ([infrastructure/aws/ec2-backend.yaml](../infrastructure/aws/ec2-backend.yaml))
2. Runtime code uses service: Yes (primary app hosting target)
3. Manual AWS setup required: Yes
4. Exact setup steps:
   - Console:
     - Create EC2 key pair in target region
     - CloudFormation -> create stack from [infrastructure/aws/ec2-backend.yaml](../infrastructure/aws/ec2-backend.yaml)
     - Pass VpcId, SubnetId, KeyPairName, DockerHubUsername, image tags, DatabaseUrl, AwsRegion, DocumentsBucketName
   - CLI:
     - aws cloudformation deploy --stack-name shms-ec2 --template-file infrastructure/aws/ec2-backend.yaml --region <region> --capabilities CAPABILITY_NAMED_IAM --parameter-overrides VpcId=<vpc-id> SubnetId=<public-subnet-id> KeyPairName=<keypair> AllowedSshCidr=<your-ip>/32 DockerHubUsername=<dockerhub-user> BackendImageTag=latest FrontendImageTag=latest DatabaseUrl=<postgres-url> AwsRegion=<region> DocumentsBucketName=<documents-bucket>
5. GitHub Secrets required:
   - EC2_HOST_DEV or EC2_HOST_PROD
   - EC2_USER_DEV or EC2_USER_PROD
   - EC2_SSH_KEY_DEV or EC2_SSH_KEY_PROD
6. Environment variables required:
   - DATABASE_URL, AWS_REGION, AWS_S3_BUCKET, JWT secrets, AI provider secrets
7. Dependencies:
   - VPC public subnet
   - RDS endpoint
   - DockerHub images
8. Verification:
   - SSH works with configured key
   - docker compose running containers on EC2
   - curl http://localhost:5000/health on EC2 succeeds
   - curl http://localhost on EC2 succeeds

### 5. S3
1. IaC exists: Yes ([infrastructure/aws/frontend-cloudfront.yaml](../infrastructure/aws/frontend-cloudfront.yaml))
2. Runtime code uses service: Yes for patient docs ([backend/src/services/storageService.js](../backend/src/services/storageService.js))
3. Manual AWS setup required: Yes
4. Exact setup steps:
   - Console:
     - Deploy stack [infrastructure/aws/frontend-cloudfront.yaml](../infrastructure/aws/frontend-cloudfront.yaml)
     - Confirm FrontendBucket and PatientDocumentsBucket outputs
   - CLI:
     - aws cloudformation deploy --stack-name shms-frontend --template-file infrastructure/aws/frontend-cloudfront.yaml --region <region>
     - aws s3 ls s3://<patient-documents-bucket>
5. GitHub Secrets required:
   - None required for S3 itself in current workflow
6. Environment variables required:
   - AWS_REGION
   - AWS_S3_BUCKET
7. Dependencies:
   - IAM role permissions on EC2
8. Verification:
   - Upload a patient document through app API and confirm object appears in S3
   - Confirm returned fileUrl points to bucket object

### 6. CloudFront
1. IaC exists: Yes ([infrastructure/aws/frontend-cloudfront.yaml](../infrastructure/aws/frontend-cloudfront.yaml))
2. Runtime code uses service: No direct backend runtime dependency
3. Manual AWS setup required: Yes
4. Exact setup steps:
   - Console:
     - Verify distribution created by CloudFormation
     - Ensure origin is frontend S3 bucket via OAC
   - CLI:
     - aws cloudfront list-distributions
     - aws cloudfront create-invalidation --distribution-id <id> --paths "/*"
5. GitHub Secrets required:
   - None required by current workflow
6. Environment variables required:
   - None
7. Dependencies:
   - Frontend S3 bucket content deployment
8. Verification:
   - Open distribution domain URL and validate React app loads
   - SPA routing returns index.html for deep links

### 7. Lambda (optional reminder trigger)
1. IaC exists: Yes ([infrastructure/aws/lambda.yaml](../infrastructure/aws/lambda.yaml))
2. Runtime code uses service: Optional (invokes backend reminder endpoint)
3. Manual AWS setup required: Yes
4. Exact setup steps:
   - Console:
     - Deploy stack with EnableReminderLambda=true
     - Set ReminderApiUrl to reachable backend endpoint
   - CLI:
     - aws cloudformation deploy --stack-name shms-reminder --template-file infrastructure/aws/lambda.yaml --region <region> --capabilities CAPABILITY_NAMED_IAM --parameter-overrides EnableReminderLambda=true ReminderScheduleExpression="cron(0 8 * * ? *)" ReminderApiUrl="http://<ec2-public-ip>:5000/api/agent/run/follow-up" ReminderApiToken="<optional-token>"
5. GitHub Secrets required:
   - None in current workflow
6. Environment variables required:
   - REMINDER_API_URL
   - REMINDER_API_TOKEN (optional)
7. Dependencies:
   - EC2 backend endpoint reachable
   - EventBridge rule
8. Verification:
   - Trigger lambda test invoke and confirm 200 response
   - Check CloudWatch logs for success message

### 8. CloudWatch
1. IaC exists: Yes (alarms and log groups in EC2, RDS, frontend, lambda templates)
2. Runtime code uses service: Indirect via infrastructure alarms/log shipping
3. Manual AWS setup required: Yes
4. Exact setup steps:
   - Console:
     - Confirm alarm resources created in each stack
     - Confirm log groups exist: /shms/ec2/cloud-init, /shms/backend/app, lambda log group
   - CLI:
     - aws cloudwatch describe-alarms
     - aws logs describe-log-groups --log-group-name-prefix /shms/
5. GitHub Secrets required: None
6. Environment variables required: None
7. Dependencies:
   - Underlying EC2/RDS/CloudFront/Lambda resources
8. Verification:
   - Alarm states visible
   - New log events written after deployment and traffic

### 9. SNS (optional alarm notifications)
1. IaC exists: No dedicated SNS topic template (only AlarmSNSTopicArn parameters)
2. Runtime code uses service: No direct backend usage
3. Manual AWS setup required: Yes if you want alert notifications
4. Exact setup steps:
   - Console:
     - SNS -> create topic -> create subscription (email/SMS)
     - Re-deploy EC2/RDS stacks with AlarmSNSTopicArn parameter
   - CLI:
     - aws sns create-topic --name shms-alarms
     - aws sns subscribe --topic-arn <topic-arn> --protocol email --notification-endpoint <email>
     - Re-run cloudformation deploy with AlarmSNSTopicArn=<topic-arn>
5. GitHub Secrets required: None
6. Environment variables required: None
7. Dependencies:
   - CloudWatch alarms
8. Verification:
   - Force alarm threshold breach in test or use alarm set-state for validation
   - Confirm notification is delivered

### 10. Bedrock (optional AI provider mode)
1. IaC exists: No
2. Runtime code uses service: Optional yes in [backend/src/services/aiService.js](../backend/src/services/aiService.js)
3. Manual AWS setup required: Yes if AI_PROVIDER=bedrock
4. Exact setup steps:
   - Console:
     - Enable Bedrock model access in selected region
     - Ensure EC2 IAM role can invoke model
   - CLI:
     - aws bedrock list-foundation-models --region <region>
     - Add policy permission bedrock:InvokeModel to EC2 role
5. GitHub Secrets required: None
6. Environment variables required:
   - AI_PROVIDER=bedrock
   - AWS_REGION
   - BEDROCK_MODEL_ID
7. Dependencies:
   - IAM role permissions
8. Verification:
   - Call AI endpoint and confirm non-fallback response in logs/API

## Ordered Setup Checklist (Empty AWS Account -> Successful GitHub Actions Deployment)
1. Configure AWS account basics
   - Set AWS budget and billing alerts
   - Select deployment region
2. Create IAM admin/deployer access and configure local AWS CLI
   - aws configure
3. Create EC2 key pair in target region
   - Save private key securely
4. Deploy VPC stack
   - Collect VpcId, public/private subnet IDs from outputs
5. Deploy S3 and CloudFront stack
   - Collect FrontendDistributionId, Frontend bucket, Patient documents bucket
6. Deploy initial RDS stack
   - Use BackendSecurityGroupId empty initially
   - Collect DB endpoint and port
7. Build and push Docker images to DockerHub
   - Confirm backend and frontend tags exist
8. Deploy EC2 stack
   - Pass DatabaseUrl, AwsRegion, DocumentsBucketName, DockerHub parameters
   - Collect EC2 public IP and backend security group ID
9. Re-deploy/tighten RDS stack
   - Pass BackendSecurityGroupId from EC2 output
10. (Optional) Create SNS topic and subscriptions
    - Re-deploy EC2/RDS stacks with AlarmSNSTopicArn
11. (Optional) Deploy Lambda reminder stack
    - EnableReminderLambda=true and configure ReminderApiUrl
12. Publish frontend assets to S3 and invalidate CloudFront cache
    - Use AWS CLI or [infrastructure/aws/publish-frontend.ps1](../infrastructure/aws/publish-frontend.ps1)
13. Configure GitHub repository and environment secrets
    - DOCKERHUB_USERNAME, DOCKERHUB_TOKEN
    - EC2_HOST_DEV, EC2_USER_DEV, EC2_SSH_KEY_DEV
    - EC2_HOST_PROD, EC2_USER_PROD, EC2_SSH_KEY_PROD
14. Validate GitHub Actions pipeline
    - Push to develop to trigger test/build/deploy-dev
    - Confirm deploy-dev job runs and health checks pass
15. Validate production path
    - Push/merge to main to trigger deploy-prod
    - Confirm deploy-prod health checks pass

## Final Verification Gate (must all pass)
- CI test job green on GitHub Actions
- Docker images pushed successfully
- Deploy job runs (not skipped for missing secrets)
- Backend health endpoint reachable
- Frontend reachable on EC2 and optionally CloudFront
- RDS reachable from backend
- Patient document upload writes to S3 when AWS vars are set
- CloudWatch alarms and logs visible
