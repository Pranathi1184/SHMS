# Database Content Guide (For Cloned Repositories)

This document explains how a new developer can get database content after cloning SHMS.

## Option A: Development Seed (Recommended)

Use this when you want a known-good local dataset quickly.

```powershell
cd backend
Copy-Item .env.example .env
# update DB credentials in .env

node scripts/ensure-db.js
node run-seed.js
```

What this does:
- Creates the target DB if missing (`ensure-db.js`)
- Recreates schema and inserts baseline data (`run-seed.js`)

Notes:
- Existing data is dropped by `run-seed.js`.
- Best for local development and QA.

## Option B: Restore Real Snapshot

Use this when you need realistic/staging-like data.

### 1. Ensure database exists
```powershell
cd backend
node scripts/ensure-db.js
```

### 2. Restore from backup file

For `.dump` backup:
```powershell
pg_restore -h localhost -U postgres -d shms path\to\backup.dump
```

For `.sql` backup:
```powershell
psql -h localhost -U postgres -d shms -f path\to\backup.sql
```

## How Maintainers Can Share Data Safely

Create a sanitized backup:
```powershell
pg_dump -h localhost -U postgres -d shms -Fc -f shms_sanitized.dump
```

Then share the backup through approved internal storage (not public repo).

## Post-Restore Verification

- Backend health:
```powershell
curl http://localhost:5000/health
```
- Login with seeded/admin credentials (if using seed path)
- Open frontend and verify lists: patients, doctors, appointments, billing

## Recommended Team Workflow

- For daily development: use Option A
- For integration/UAT parity: use Option B with a sanitized snapshot
