# Smart Hospital Management System (SHMS)

Production-oriented Smart Hospital Management System with role-based workflows, AI-assisted operations, ETL analytics, and Docker-ready deployment.

## Tech Stack
- Frontend: React + Vite + Material UI
- Backend: Node.js + Express + Sequelize
- Database: PostgreSQL
- AI: Groq (OpenAI-compatible SDK) + LangGraph agents
- ETL/Analytics: Python + Pandas + Airflow
- Infra/DevOps: Docker, GitHub Actions, AWS IaC templates

## AI Features

The system includes two categories of AI-powered capabilities:

### 1. Generative AI (GenAI) Features - Real-Time Assistance
Groq-powered (with OpenAI/Gemini/Bedrock fallback) features providing instant clinical insights and communication support:

- **Patient Summary**: Automatically generate comprehensive clinical summaries from EHR records, lab results, and prescription history
- **Medical Report**: Convert informal doctor notes into formal clinical documentation (History/Assessment/Plan sections)
- **Appointment Reminder**: Generate professional, personalized appointment reminders with date, time, and doctor info
- **Chatbot**: Role-aware conversational assistant with scoped context:
  - **Patients**: Access own prescriptions, appointments, lab results with privacy protection
  - **Doctors**: Query department info, assigned patients, clinical guidelines
  - **Administrators**: Hospital metrics, operational dashboards, policy queries
  - **Staff**: Daily operational summaries, patient lookups (role-restricted)

### 2. AI Agents (Agentic AI) - Automated Workflows
LangGraph-based agents running on schedule (or manually triggered) to automate complex workflows:

- **Scheduling Agent**: Analyzes appointment slots and suggests optimal 30-minute booking times for doctors
- **Follow-up Agent**: Identifies discharged patients and automatically generates follow-up reminders + notifications
- **Inventory Agent**: Monitors medicine stock levels and recommends reorder quantities with 30-day usage buffer
- **Billing Agent**: Flags overdue payments, analyzes collection risk, and generates patient reminder templates

**Execution**: Agents run daily at scheduled times (configurable via environment) or triggered manually from AI Center. All executions logged in AuditLog for compliance/auditing.

### Accessing AI Features
1. **AI Center Dashboard** (`/ai-center`): 
   - Navigate via sidebar menu → "AI Center"
   - Available to all 8 user roles
   - Dual-tab interface: GenAI features + Agent controls
   
2. **AI Floating Assistant**:
   - Appears as floating widget (bottom-right) on all pages
   - Multi-turn conversation support
   - Automatic intent detection (keywords trigger agents or chatbot fallback)

### Configuration
Set these environment variables in `backend/.env`:

```env
# AI Provider (groq | openai | gemini | bedrock)
AI_PROVIDER=groq
GROQ_API_KEY=your_groq_api_key_here

# Optional fallback providers
OPENAI_API_KEY=...
GEMINI_API_KEY=...
AWS_BEDROCK_REGION=us-east-1

# Agent scheduling (cron expressions)
ENABLE_AGENT_JOBS=true
AGENT_SCHEDULING_CRON="0 7 * * *"      # 7 AM daily
AGENT_FOLLOW_UP_CRON="0 8 * * *"       # 8 AM daily
AGENT_INVENTORY_CRON="0 22 * * *"      # 10 PM daily
AGENT_BILLING_CRON="0 9 * * *"         # 9 AM daily

# Model configuration
GROQ_MODEL=llama-3.1-8b-instant
TEMPERATURE=0.4
```

## Project Structure
- `backend/`: API, auth, RBAC, domain modules, AI/agent endpoints, tests
- `frontend/`: role-aware dashboard and module pages
- `etl/`: extraction/transform/load scripts + Airflow DAG
- `infrastructure/`: AWS templates
- `devops/`: Docker assets
- `docs/`: setup and operational documentation

## Quick Start (Local)

### One-Command Bootstrap (Windows)
From repository root:

```powershell
.\setup.ps1
```

This script:
- creates `backend/.env` from `backend/.env.example` if missing
- installs backend and frontend dependencies
- ensures PostgreSQL database exists
- syncs schema and seeds baseline data
- starts backend and frontend in separate PowerShell windows

Optional flags:

```powershell
.\setup.ps1 -NoStartApps
.\setup.ps1 -SkipInstall
.\setup.ps1 -SkipSeed
```

### 1. Install dependencies
```powershell
cd backend
npm install
cd ..\frontend
npm install
```

### 2. Configure backend environment
```powershell
cd ..\backend
Copy-Item .env.example .env
```

Update values in `.env` as needed (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `JWT_*`, `GROQ_API_KEY`).

### 3. Create DB and seed baseline data
```powershell
node scripts/ensure-db.js
node run-seed.js
```

This gives a fresh schema plus sample users and domain data for immediate login/testing.

### 4. Run apps
```powershell
# terminal 1
cd backend
npm run dev

# terminal 2
cd frontend
npm run dev
```

Backend: `http://localhost:5000`
Frontend: `http://localhost:5173`

## Docker Start
```powershell
docker compose up --build
```

Services include Postgres, backend, frontend, and Airflow.

## For New Contributors: How to Clone and Get Database Content

Use one of these paths:

1. Seed path (recommended for development)
- Clone repo
- Configure `backend/.env`
- Run:
```powershell
cd backend
node scripts/ensure-db.js
node run-seed.js
```

2. Restore path (for realistic/staging snapshots)
- Obtain a `.dump`/`.sql` backup from maintainers
- Create target DB (`node scripts/ensure-db.js`)
- Restore with `pg_restore` or `psql`

Example:
```powershell
pg_restore -h localhost -U postgres -d shms path\to\backup.dump
```

Detailed guide: see [docs/DATABASE_CONTENT_GUIDE.md](docs/DATABASE_CONTENT_GUIDE.md)

## Test and Build

Backend tests (includes AI agent tests):
```powershell
cd backend
npm test -- --runInBand
```

Frontend tests and build:
```powershell
cd frontend
npm test -- --runInBand --watchAll=false
npm run build
```

## Testing AI Features

### Setup
1. Start backend and frontend (see Quick Start section)
2. Ensure `GROQ_API_KEY` is set in `backend/.env`
3. Backend should have seed data: `node run-seed.js` from project root
4. Login as any role (test credentials available in seed data)

### Test GenAI Features
From AI Center (`/ai-center`), switch to "Generative AI" tab:

- **Patient Summary**: Select a patient from dropdown → view auto-generated clinical summary
- **Medical Report**: Enter sample doctor notes → get formal report format conversion
- **Appointment Reminder**: Select an appointment → generate professional reminder text
- **Chatbot**: Type natural language query → AI provides role-specific context response

**Expected behavior**: All requests complete in 2-5 seconds with graceful fallback messages if API key missing.

### Test Agents
From AI Center, switch to "AI Agents" tab:

- **Scheduling Agent**: Select date + doctor → get 3 suggested appointment slots
- **Follow-up Agent**: Click trigger → logs agent run, creates patient notifications
- **Inventory Agent**: Click trigger → identifies low-stock medicines, recommends reorder quantities
- **Billing Agent**: Click trigger → flags overdue bills, generates collection reminders

**Execution tracking**: Scroll down to "Agent Execution History" to see all runs (manual + scheduled) with timestamps, status, and metadata.

### Floating Assistant Test
On any page, click the floating chat widget (bottom-right):

```
User: "schedule an appointment for tomorrow"
→ Agent recognizes "schedule" keyword, runs Scheduling Agent

User: "what are my prescriptions?"
→ Chatbot query with role-specific context (e.g., patient sees only own prescriptions)
```

## Documentation
- Setup/onboarding: [docs/SETUP_AND_ONBOARDING.md](docs/SETUP_AND_ONBOARDING.md)
- Database content and backup/restore: [docs/DATABASE_CONTENT_GUIDE.md](docs/DATABASE_CONTENT_GUIDE.md)
