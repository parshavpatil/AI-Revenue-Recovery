# Module 1 Architecture

## Purpose

Establish a stable monorepo boundary before implementing domain logic.

## Services

### Web
Next.js merchant-facing dashboard.

### API
NestJS application for HTTP APIs and webhook endpoints.

### Worker
Node.js background process. Queue consumers will be introduced in Module 5.

### Recovery Model
FastAPI service boundary for prediction/risk scoring. Model logic starts in Module 6.

### Shared
Small package for cross-service constants/types that are safe to share.

## Infrastructure

PostgreSQL and Redis are provided locally by Docker Compose.

They are not yet wired into application code; that happens in Module 2 and Module 5.

## Dependency direction

```text
web ───────────────> api
                     │
                     ├──> shared
                     ├──> database (Module 2)
                     ├──> razorpay (Module 4)
                     ├──> ai (Module 7)
                     ├──> voice (Module 9)
                     └──> policy (Module 8)

worker ─────────────> shared
worker ─────────────> queue/db (later modules)

api ────────────────> recovery-model
```

The recovery-model service is intentionally isolated from the main API so it can be replaced or scaled independently.
