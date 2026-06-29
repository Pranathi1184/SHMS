# SHMS CI/CD Pipeline Runbook

## What This Pipeline Does
- Runs backend and frontend tests on each PR to `main`.
- Builds frontend/backend Docker images after tests pass on pushes to `develop` and `main`.
- Deploys to EC2 development on `develop` pushes.
- Deploys to EC2 production on `main` pushes.

## Workflow File
- `.github/workflows/main.yml`

## Required GitHub Secrets
Set these in repository settings before first end-to-end run.

### DockerHub (for image publishing)
- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`

### EC2 Development Deployment
- `EC2_HOST_DEV`
- `EC2_USER_DEV`
- `EC2_SSH_KEY_DEV`

### EC2 Production Deployment
- `EC2_HOST_PROD`
- `EC2_USER_PROD`
- `EC2_SSH_KEY_PROD`

## GitHub Environments
Create two environments in GitHub:
- `development`
- `production`

Recommended controls:
- Require reviewer approval for `production`.
- Scope deployment secrets to each environment where possible.

## First End-to-End Validation
1. Open Actions tab and run `SHMS CI/CD Pipeline` manually using `workflow_dispatch`.
2. Check `test` job:
   - Postgres service starts.
   - Backend seed/setup succeeds.
   - Backend tests pass.
   - Frontend tests pass.
   - Frontend build succeeds.
3. Push a small change to `develop` and confirm:
   - `build-and-push` publishes Docker images.
   - `deploy-dev` updates EC2 and passes localhost health checks.
4. Merge to `main` and confirm:
   - `deploy-prod` updates EC2 and passes localhost health checks.

## EC2 Host Prerequisites
Ensure both EC2 hosts already have:
- Docker Engine + Docker Compose plugin (`docker compose` command available)
- Repository cloned to `~/shms`
- Branches `develop` and `main` present
- Service ports open as needed in security groups (at least `80`; `5000` only if intentionally public)

## Troubleshooting
- If tests fail only in CI: compare env vars and seeded test data assumptions.
- If deployment job fails at SSH: verify username, host reachability, and private key format.
- If deployment job passes but app is stale: confirm remote branch updated and `docker compose up -d --build` rebuilt containers.
- If health check fails: inspect remote logs:
  - `docker compose ps`
  - `docker compose logs --tail=200 backend`
  - `docker compose logs --tail=200 frontend`
