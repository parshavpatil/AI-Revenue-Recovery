-- Initial schema migration.
-- Generated from packages/database/prisma/schema.prisma.

CREATE TYPE "UserRole" AS ENUM ('OWNER', 'ADMIN', 'OPERATOR', 'VIEWER');
CREATE TYPE "MerchantStatus" AS ENUM ('ACTIVE', 'SUSPENDED');
CREATE TYPE "CustomerStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BLOCKED');
CREATE TYPE "PaymentStatus" AS ENUM ('CREATED', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'DISPUTED', 'UNKNOWN');
CREATE TYPE "PaymentMethod" AS ENUM ('CARD', 'UPI', 'NETBANKING', 'WALLET', 'EMI', 'OTHER');
CREATE TYPE "PaymentFailureCategory" AS ENUM ('INSUFFICIENT_FUNDS', 'NETWORK', 'BANK_DECLINED', 'AUTHENTICATION', 'EXPIRED', 'INVALID_DETAILS', 'FRAUD_SUSPECTED', 'LIMIT_EXCEEDED', 'UNKNOWN');
CREATE TYPE "RecoveryCaseStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'PROMISED', 'RECOVERED', 'EXPIRED', 'STOPPED', 'ESCALATED');
CREATE TYPE "RecoveryPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "RecoveryActionType" AS ENUM ('RETRY_PAYMENT', 'CREATE_PAYMENT_LINK', 'SEND_PAYMENT_LINK', 'VOICE_CALL', 'SEND_MESSAGE', 'WAIT', 'ESCALATE', 'STOP');
CREATE TYPE "RecoveryActionStatus" AS ENUM ('PROPOSED', 'APPROVED', 'REJECTED', 'QUEUED', 'EXECUTING', 'SUCCEEDED', 'FAILED', 'CANCELLED');
CREATE TYPE "VoiceCallStatus" AS ENUM ('QUEUED', 'RINGING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'NO_ANSWER', 'BUSY', 'CANCELLED');
CREATE TYPE "VoiceCallOutcome" AS ENUM ('PAYMENT_LINK_REQUESTED', 'PAYMENT_INTENT', 'PROMISE_TO_PAY', 'CALLBACK_REQUESTED', 'NOT_INTERESTED', 'WRONG_NUMBER', 'OPT_OUT', 'OTHER');
CREATE TYPE "PromiseStatus" AS ENUM ('PROMISED', 'PENDING', 'FULFILLED', 'BROKEN', 'EXPIRED', 'CANCELLED');
CREATE TYPE "AuditActorType" AS ENUM ('SYSTEM', 'USER', 'AI_AGENT', 'WEBHOOK', 'WORKER');
CREATE TYPE "PolicyDecision" AS ENUM ('ALLOW', 'DENY', 'REQUIRES_APPROVAL');

CREATE TABLE "Merchant" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "razorpayAccountId" TEXT,
  "status" "MerchantStatus" NOT NULL DEFAULT 'ACTIVE',
  "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Merchant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "merchantId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'OPERATOR',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Customer" (
  "id" TEXT NOT NULL,
  "merchantId" TEXT NOT NULL,
  "externalCustomerId" TEXT,
  "name" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "status" "CustomerStatus" NOT NULL DEFAULT 'ACTIVE',
  "preferredLanguage" TEXT DEFAULT 'hinglish',
  "voiceOptIn" BOOLEAN NOT NULL DEFAULT false,
  "smsOptIn" BOOLEAN NOT NULL DEFAULT true,
  "doNotContact" BOOLEAN NOT NULL DEFAULT false,
  "lifetimeValue" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "successfulPayments" INTEGER NOT NULL DEFAULT 0,
  "failedPayments" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Payment" (
  "id" TEXT NOT NULL,
  "merchantId" TEXT NOT NULL,
  "customerId" TEXT,
  "razorpayPaymentId" TEXT,
  "razorpayOrderId" TEXT,
  "razorpayInvoiceId" TEXT,
  "amount" DECIMAL(14,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'INR',
  "status" "PaymentStatus" NOT NULL,
  "method" "PaymentMethod",
  "failureCategory" "PaymentFailureCategory",
  "failureCode" TEXT,
  "failureReason" TEXT,
  "capturedAt" TIMESTAMP(3),
  "failedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PaymentEvent" (
  "id" TEXT NOT NULL,
  "paymentId" TEXT,
  "razorpayEventId" TEXT,
  "eventType" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "occurredAt" TIMESTAMP(3),
  "processedAt" TIMESTAMP(3),
  "processingStatus" TEXT NOT NULL DEFAULT 'RECEIVED',
  "processingError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PaymentEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RecoveryCase" (
  "id" TEXT NOT NULL,
  "merchantId" TEXT NOT NULL,
  "customerId" TEXT,
  "paymentId" TEXT,
  "status" "RecoveryCaseStatus" NOT NULL DEFAULT 'OPEN',
  "priority" "RecoveryPriority" NOT NULL DEFAULT 'MEDIUM',
  "failureCategory" "PaymentFailureCategory",
  "revenueAtRisk" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "recoveryProbability" DECIMAL(5,4) NOT NULL DEFAULT 0,
  "expectedRecovery" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "lastAttemptAt" TIMESTAMP(3),
  "nextActionAt" TIMESTAMP(3),
  "recoveredAt" TIMESTAMP(3),
  "stoppedAt" TIMESTAMP(3),
  "stopReason" TEXT,
  "aiSummary" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RecoveryCase_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RecoveryAction" (
  "id" TEXT NOT NULL,
  "recoveryCaseId" TEXT NOT NULL,
  "type" "RecoveryActionType" NOT NULL,
  "status" "RecoveryActionStatus" NOT NULL DEFAULT 'PROPOSED',
  "policyDecision" "PolicyDecision",
  "policyReason" TEXT,
  "aiReason" TEXT,
  "input" JSONB,
  "output" JSONB,
  "idempotencyKey" TEXT,
  "scheduledFor" TIMESTAMP(3),
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "errorCode" TEXT,
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RecoveryAction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VoiceCall" (
  "id" TEXT NOT NULL,
  "recoveryCaseId" TEXT NOT NULL,
  "customerId" TEXT,
  "provider" TEXT,
  "providerCallId" TEXT,
  "phoneNumber" TEXT,
  "language" TEXT NOT NULL DEFAULT 'hinglish',
  "status" "VoiceCallStatus" NOT NULL DEFAULT 'QUEUED',
  "outcome" "VoiceCallOutcome",
  "durationSeconds" INTEGER,
  "startedAt" TIMESTAMP(3),
  "endedAt" TIMESTAMP(3),
  "summary" TEXT,
  "sentiment" TEXT,
  "confidence" DECIMAL(5,4),
  "failureReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VoiceCall_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VoiceTranscript" (
  "id" TEXT NOT NULL,
  "voiceCallId" TEXT NOT NULL,
  "sequence" INTEGER NOT NULL,
  "speaker" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "language" TEXT,
  "intent" TEXT,
  "confidence" DECIMAL(5,4),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VoiceTranscript_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PromiseToPay" (
  "id" TEXT NOT NULL,
  "recoveryCaseId" TEXT NOT NULL,
  "customerId" TEXT,
  "voiceCallId" TEXT,
  "promisedAmount" DECIMAL(14,2) NOT NULL,
  "promisedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "promisedFor" TIMESTAMP(3),
  "status" "PromiseStatus" NOT NULL DEFAULT 'PROMISED',
  "fulfilledAt" TIMESTAMP(3),
  "brokenAt" TIMESTAMP(3),
  "notes" TEXT,
  "confidence" DECIMAL(5,4),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PromiseToPay_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Policy" (
  "id" TEXT NOT NULL,
  "merchantId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "maxRetryAttempts" INTEGER NOT NULL DEFAULT 2,
  "maxVoiceAttempts" INTEGER NOT NULL DEFAULT 2,
  "minRecoveryScore" DECIMAL(5,4) NOT NULL DEFAULT 0.65,
  "callingStartHour" INTEGER NOT NULL DEFAULT 9,
  "callingEndHour" INTEGER NOT NULL DEFAULT 20,
  "config" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Policy_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL,
  "merchantId" TEXT,
  "recoveryCaseId" TEXT,
  "actorType" "AuditActorType" NOT NULL,
  "actorId" TEXT,
  "action" TEXT NOT NULL,
  "resourceType" TEXT NOT NULL,
  "resourceId" TEXT,
  "decision" "PolicyDecision",
  "reason" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Merchant_razorpayAccountId_key" ON "Merchant"("razorpayAccountId");
CREATE UNIQUE INDEX "User_merchantId_email_key" ON "User"("merchantId", "email");
CREATE UNIQUE INDEX "Customer_merchantId_externalCustomerId_key" ON "Customer"("merchantId", "externalCustomerId");
CREATE UNIQUE INDEX "Payment_razorpayPaymentId_key" ON "Payment"("razorpayPaymentId");
CREATE UNIQUE INDEX "PaymentEvent_razorpayEventId_key" ON "PaymentEvent"("razorpayEventId");
CREATE UNIQUE INDEX "RecoveryAction_idempotencyKey_key" ON "RecoveryAction"("idempotencyKey");
CREATE UNIQUE INDEX "VoiceCall_providerCallId_key" ON "VoiceCall"("providerCallId");
CREATE UNIQUE INDEX "VoiceTranscript_voiceCallId_sequence_key" ON "VoiceTranscript"("voiceCallId", "sequence");

CREATE INDEX "Merchant_status_idx" ON "Merchant"("status");
CREATE INDEX "Merchant_createdAt_idx" ON "Merchant"("createdAt");
CREATE INDEX "User_merchantId_role_idx" ON "User"("merchantId", "role");
CREATE INDEX "Customer_merchantId_status_idx" ON "Customer"("merchantId", "status");
CREATE INDEX "Customer_merchantId_phone_idx" ON "Customer"("merchantId", "phone");
CREATE INDEX "Payment_merchantId_status_idx" ON "Payment"("merchantId", "status");
CREATE INDEX "Payment_customerId_status_idx" ON "Payment"("customerId", "status");
CREATE INDEX "Payment_merchantId_failedAt_idx" ON "Payment"("merchantId", "failedAt");
CREATE INDEX "Payment_razorpayOrderId_idx" ON "Payment"("razorpayOrderId");
CREATE INDEX "PaymentEvent_eventType_createdAt_idx" ON "PaymentEvent"("eventType", "createdAt");
CREATE INDEX "PaymentEvent_processingStatus_createdAt_idx" ON "PaymentEvent"("processingStatus", "createdAt");
CREATE INDEX "RecoveryCase_merchantId_status_priority_idx" ON "RecoveryCase"("merchantId", "status", "priority");
CREATE INDEX "RecoveryCase_customerId_status_idx" ON "RecoveryCase"("customerId", "status");
CREATE INDEX "RecoveryCase_paymentId_idx" ON "RecoveryCase"("paymentId");
CREATE INDEX "RecoveryCase_nextActionAt_idx" ON "RecoveryCase"("nextActionAt");
CREATE INDEX "RecoveryAction_recoveryCaseId_createdAt_idx" ON "RecoveryAction"("recoveryCaseId", "createdAt");
CREATE INDEX "RecoveryAction_status_scheduledFor_idx" ON "RecoveryAction"("status", "scheduledFor");
CREATE INDEX "RecoveryAction_type_status_idx" ON "RecoveryAction"("type", "status");
CREATE INDEX "VoiceCall_recoveryCaseId_createdAt_idx" ON "VoiceCall"("recoveryCaseId", "createdAt");
CREATE INDEX "VoiceCall_customerId_createdAt_idx" ON "VoiceCall"("customerId", "createdAt");
CREATE INDEX "VoiceCall_status_createdAt_idx" ON "VoiceCall"("status", "createdAt");
CREATE INDEX "VoiceTranscript_voiceCallId_createdAt_idx" ON "VoiceTranscript"("voiceCallId", "createdAt");
CREATE INDEX "PromiseToPay_recoveryCaseId_status_idx" ON "PromiseToPay"("recoveryCaseId", "status");
CREATE INDEX "PromiseToPay_customerId_status_idx" ON "PromiseToPay"("customerId", "status");
CREATE INDEX "PromiseToPay_promisedFor_status_idx" ON "PromiseToPay"("promisedFor", "status");
CREATE INDEX "Policy_merchantId_isActive_idx" ON "Policy"("merchantId", "isActive");
CREATE INDEX "AuditLog_merchantId_createdAt_idx" ON "AuditLog"("merchantId", "createdAt");
CREATE INDEX "AuditLog_recoveryCaseId_createdAt_idx" ON "AuditLog"("recoveryCaseId", "createdAt");
CREATE INDEX "AuditLog_resourceType_resourceId_idx" ON "AuditLog"("resourceType", "resourceId");

ALTER TABLE "User" ADD CONSTRAINT "User_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PaymentEvent" ADD CONSTRAINT "PaymentEvent_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RecoveryCase" ADD CONSTRAINT "RecoveryCase_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecoveryCase" ADD CONSTRAINT "RecoveryCase_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RecoveryCase" ADD CONSTRAINT "RecoveryCase_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RecoveryAction" ADD CONSTRAINT "RecoveryAction_recoveryCaseId_fkey" FOREIGN KEY ("recoveryCaseId") REFERENCES "RecoveryCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VoiceCall" ADD CONSTRAINT "VoiceCall_recoveryCaseId_fkey" FOREIGN KEY ("recoveryCaseId") REFERENCES "RecoveryCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VoiceCall" ADD CONSTRAINT "VoiceCall_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "VoiceTranscript" ADD CONSTRAINT "VoiceTranscript_voiceCallId_fkey" FOREIGN KEY ("voiceCallId") REFERENCES "VoiceCall"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PromiseToPay" ADD CONSTRAINT "PromiseToPay_recoveryCaseId_fkey" FOREIGN KEY ("recoveryCaseId") REFERENCES "RecoveryCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PromiseToPay" ADD CONSTRAINT "PromiseToPay_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Policy" ADD CONSTRAINT "Policy_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
