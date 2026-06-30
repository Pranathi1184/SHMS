# SHMS Demo Presentation Runbook (Step-by-Step)

This runbook is for presenting SHMS to evaluators, interviewers, or stakeholders. It assumes you want a smooth, repeatable story from login to AI features to deployment evidence.

## 1. Demo Objective (say this first)
- SHMS is a full-stack hospital platform with RBAC, clinical workflows, AI assistance, ETL analytics, and CI/CD deployment support.
- The system supports both local Docker and AWS deployment architecture.

## 2. Pre-Demo Checklist (30-45 minutes before)
1. Verify backend and frontend are up
   - Backend: http://localhost:5000/health
   - Frontend: http://localhost:5173 (or http://localhost via Docker)
2. Verify database is seeded
   - From [backend/run-seed.js](../backend/run-seed.js), run seeding if needed
3. Verify at least one AI provider key is configured
   - GROQ_API_KEY preferred for fastest demo path
4. Verify login credentials are ready
   - Seeded users are printed by seeder output
5. Open these tabs in advance
   - Login page
   - AI Center
   - Appointments
   - Patients
   - Billing
   - Optional: AWS console, GitHub Actions run history

## 3. Suggested Demo Flow (20-30 minutes)
1. Architecture overview (2 minutes)
   - Show repository structure in [README.md](../README.md)
   - Mention backend, frontend, ETL, infrastructure, docs
2. Role-based login (2 minutes)
   - Login as Administrator
   - Mention role restrictions and access control
3. Core operations (6 minutes)
   - Create or view a patient
   - Show appointment scheduling
   - Show billing screen and generated bill data
4. AI capabilities (6 minutes)
   - Open AI Center
   - Generate patient summary
   - Generate medical report from notes
   - Trigger one AI agent (inventory or follow-up)
5. File/document workflow (3 minutes)
   - Upload patient document
   - Explain local fallback vs S3 mode behavior from [backend/src/services/storageService.js](../backend/src/services/storageService.js)
6. ETL/analytics proof (3 minutes)
   - Show Airflow DAG status or analytics output
7. DevOps and release readiness (4 minutes)
   - Show workflow in [.github/workflows/main.yml](../.github/workflows/main.yml)
   - Explain test -> build -> deploy stages
   - Show latest successful run in GitHub Actions

## 4. AWS Story (what to say if asked)
1. Be explicit: current audit assumes no deployed AWS resources until proven
2. Point to IaC templates under [infrastructure/aws](../infrastructure/aws)
3. Mention deployment order from [docs/AWS_DEPLOYMENT_READINESS_AUDIT.md](AWS_DEPLOYMENT_READINESS_AUDIT.md)
4. Explain runtime AWS usage:
   - S3 upload path in [backend/src/services/storageService.js](../backend/src/services/storageService.js)
   - Optional Bedrock provider in [backend/src/services/aiService.js](../backend/src/services/aiService.js)

## 5. Live Commands (safe to run before audience joins)
- Backend tests: cd backend; npm test -- --runInBand
- Frontend tests: cd frontend; npm test -- --watchAll=false
- Frontend build: cd frontend; npm run build
- Reseed data: cd backend; node run-seed.js

## 6. Demo Success Criteria
- You can log in with seeded user
- Patient and appointment screens load and return data
- At least one AI action returns meaningful output
- Billing data is visible with no runtime error
- CI workflow definition is shown and explained clearly

## 7. Common Failure Recovery Plan
1. Login fails
   - Re-run seeder and retry default credentials
2. AI request fails
   - Check provider key, fallback message, and switch to another AI provider if needed
3. Backend endpoint error
   - Restart backend and verify DB connection
4. Frontend blank page
   - Rebuild frontend and refresh
5. Docker issue
   - docker compose down; docker compose up --build

## 8. Closing Script (1 minute)
- SHMS demonstrates real hospital workflows, production-like architecture, and modern AI integration.
- The project includes deterministic seeding, role-aware APIs, ETL analytics, and CI/CD automation.
- AWS deployment is infrastructure-ready with explicit step-by-step readiness checklist and verification criteria.
