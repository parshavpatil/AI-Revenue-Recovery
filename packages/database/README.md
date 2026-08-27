# RecoverAI Database

PostgreSQL + Prisma domain layer.

## Main entities

- Merchant
- User
- Customer
- Payment
- PaymentEvent
- RecoveryCase
- RecoveryAction
- VoiceCall
- VoiceTranscript
- PromiseToPay
- Policy
- AuditLog

## First-time setup

From repository root:

```bash
pnpm install
docker compose up -d postgres
pnpm --filter @recoverai/database generate
pnpm --filter @recoverai/database validate
pnpm --filter @recoverai/database migrate:dev --name init
pnpm --filter @recoverai/database db:seed
```

Open Prisma Studio:

```bash
pnpm --filter @recoverai/database studio
```

## Data-model design principles

1. Every merchant-owned object carries `merchantId` directly or indirectly.
2. External Razorpay IDs are retained for idempotent synchronization.
3. Payment events are stored separately from normalized payment state.
4. Recovery actions are append-only workflow records rather than mutating the recovery case's history.
5. AI decisions and policy decisions are stored for explainability.
6. Voice calls and transcripts are first-class entities.
7. Promise-to-pay is modeled separately because it has its own lifecycle.
8. Audit logs are immutable application records.
