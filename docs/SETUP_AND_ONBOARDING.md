# SHMS Setup and Onboarding

## Fastest Path (Windows)
From repo root:

```powershell
.\setup.ps1
```

Optional:

```powershell
.\setup.ps1 -NoStartApps
.\setup.ps1 -SkipInstall
.\setup.ps1 -SkipSeed
```

## Prerequisites
- Node.js 18+
- PostgreSQL 14+ (or Docker Desktop)
- npm

## Clone and Install
```powershell
git clone <your-repo-url>
cd shms

cd backend
npm install

cd ..\frontend
npm install
```

## Backend Environment
```powershell
cd ..\backend
Copy-Item .env.example .env
```

Required values in `.env`:
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `GROQ_API_KEY` (for AI features)

## Create and Seed Database Content
```powershell
cd backend
node scripts/ensure-db.js
node run-seed.js
```

Important:
- `run-seed.js` runs `sequelize.sync({ force: true })` and recreates schema from scratch.
- Use this for local development reset, not for preserving existing DB data.

## Start Services (Local)
```powershell
# terminal 1
cd backend
npm run dev

# terminal 2
cd frontend
npm run dev
```

## Start Services (Docker)
```powershell
docker compose up --build
```

Docker config notes:
- `backend/.env` is mounted into backend runtime through Compose `env_file`.
- Backend DB host is overridden to `db` in Compose.
- `.env` files are excluded from Docker build context, so secrets are not baked into images.

## Validation
Backend:
```powershell
cd backend
npm test -- --runInBand
```

Frontend:
```powershell
cd frontend
npm test -- --runInBand --watchAll=false
npm run build
```

## Troubleshooting
- Port conflict on backend:
  - Stop old node processes and retry `npm run dev`.
- Login errors after fresh clone:
  - Ensure DB exists (`node scripts/ensure-db.js`) and rerun seed (`node run-seed.js`).
- AI endpoints failing:
  - Check `GROQ_API_KEY`.
- Docker backend cannot connect to DB:
  - Confirm `backend/.env` exists and run `docker compose config` to verify `env_file` resolution.
