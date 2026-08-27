# RecoverAI Voice ERD

```text
┌─────────────┐
│   Merchant  │
└──────┬──────┘
       ├────────────── User
       ├────────────── Customer ───────────────┐
       │                  │                    │
       │                  ├── Payment          │
       │                  ├── VoiceCall         │
       │                  └── PromiseToPay      │
       │                                        │
       ├────────────── Policy                   │
       │                                        │
       └────────────── RecoveryCase ◀───────────┘
                            │
                            ├── RecoveryAction
                            ├── VoiceCall ── VoiceTranscript
                            ├── PromiseToPay
                            └── AuditLog
```

Payment event history is attached to `Payment` through `PaymentEvent`.

The recovery case is the central business object connecting the failed payment with subsequent recovery interventions.
