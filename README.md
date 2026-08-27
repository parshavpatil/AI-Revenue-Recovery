# AI Revenue Recovery

Payment failure recovery + Hinglish voice reminder platform for the Razorpay AI Revenue Recovery buildathon track.

## Current module

**Module 1 — Project Foundation**

This module establishes the monorepo, basic applications/services, shared package, local Docker infrastructure, environment configuration, and health checks.

## Repository layout

```text
recoverai-voice/
├── apps/
│   ├── web/                 # Next.js merchant dashboard
│   ├── api/                 # NestJS API
│   └── worker/              # Background worker
├── packages/
│   └── shared/              # Shared types/constants
├── services/
│   └── recovery-model/      # FastAPI service placeholder
├── infrastructure/
│   └── docker/
├── docs/
├── scripts/
├── tests/
├── docker-compose.yml
├── package.json
├── pnpm-workspace.yaml
└── .env.example
```

## Prerequisites

- Node.js 20+
- pnpm 10+
- Python 3.11+
- Docker Desktop

## Install

```bash
pnpm install
```

## Run Node services

```bash
pnpm dev
```

Web:
- http://localhost:3000

API:
- http://localhost:4000
- http://localhost:4000/health

Worker:
- starts in development watch mode

## Run recovery model service

```bash
cd services/recovery-model
python -m venv .venv
# Windows PowerShell
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Health:
- http://localhost:8000/health

## Run infrastructure

```bash
docker compose up -d postgres redis
```

PostgreSQL and Redis are intentionally introduced in Module 1 but application persistence/queues are implemented in later modules.

## Environment

Copy:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Do not commit `.env`.

## Next module

Module 2 will add PostgreSQL + Prisma and the complete domain schema.
