# Module 2 — Database Design

## Core flow

```text
Merchant
  └── Customer
        └── Payment
              └── PaymentEvent

Payment
  └── RecoveryCase
        ├── RecoveryAction
        ├── VoiceCall
        │     └── VoiceTranscript
        ├── PromiseToPay
        └── AuditLog
```

## Important states

### Payment
CREATED → AUTHORIZED → CAPTURED

or

CREATED → FAILED

### Recovery case

OPEN → IN_PROGRESS → PROMISED → RECOVERED

Alternative terminal states:
EXPIRED, STOPPED, ESCALATED

### Voice call

QUEUED → RINGING → IN_PROGRESS → COMPLETED

Failure terminal states:
FAILED, NO_ANSWER, BUSY, CANCELLED

### Promise-to-pay

PROMISED → PENDING → FULFILLED

Alternative:
BROKEN, EXPIRED, CANCELLED

## Why PaymentEvent exists separately

The normalized `Payment` row represents the latest known state.

`PaymentEvent` stores webhook/event history so we can:

- replay events,
- debug failures,
- build audit trails,
- identify duplicate events,
- support idempotent processing.

## Why RecoveryAction is separate

One recovery case can involve multiple interventions:

```text
VOICE_CALL
    ↓
PAYMENT_LINK
    ↓
WAIT
    ↓
RETRY
```

Keeping each action as a separate record lets us evaluate:

- which strategy was chosen,
- why it was chosen,
- whether policy allowed it,
- execution result,
- latency,
- recovery outcome.

## Why PromiseToPay is separate

A promise is a business state, not merely a voice-call transcript.

It must survive after the call ends and can later be fulfilled or broken based on a real payment event.
