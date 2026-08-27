# RecoverAI API — Module 3

NestJS backend foundation connected to Prisma.

## Run

From project root:

```bash
pnpm install
docker compose up -d postgres
pnpm --filter @recoverai/database generate
pnpm --filter @recoverai/database migrate:dev
pnpm --filter @recoverai/database db:seed
pnpm --filter @recoverai/api dev
```

Base URL: `http://localhost:4000/api`

## Endpoints

- `GET /api/health`
- `GET /api/health/db`
- `POST/GET /api/merchants`
- `GET/PATCH /api/merchants/:id`
- `POST/GET /api/merchants/:merchantId/customers`
- `GET/PATCH /api/merchants/:merchantId/customers/:id`
- `GET /api/merchants/:merchantId/recovery-cases`
- `GET /api/merchants/:merchantId/recovery-cases/:id`

Authentication is intentionally deferred until the security-hardening phase.
