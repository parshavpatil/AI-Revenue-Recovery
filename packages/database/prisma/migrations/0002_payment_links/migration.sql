CREATE TABLE "PaymentLink" (
  "id" TEXT NOT NULL,
  "merchantId" TEXT NOT NULL,
  "recoveryCaseId" TEXT,
  "customerId" TEXT,
  "razorpayPaymentLinkId" TEXT NOT NULL,
  "referenceId" TEXT NOT NULL,
  "shortUrl" TEXT NOT NULL,
  "amount" DECIMAL(14,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'INR',
  "status" TEXT NOT NULL,
  "expireBy" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PaymentLink_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PaymentLink_razorpayPaymentLinkId_key" ON "PaymentLink"("razorpayPaymentLinkId");
CREATE UNIQUE INDEX "PaymentLink_referenceId_key" ON "PaymentLink"("referenceId");
CREATE INDEX "PaymentLink_merchantId_status_idx" ON "PaymentLink"("merchantId", "status");
CREATE INDEX "PaymentLink_recoveryCaseId_createdAt_idx" ON "PaymentLink"("recoveryCaseId", "createdAt");
CREATE INDEX "PaymentLink_customerId_createdAt_idx" ON "PaymentLink"("customerId", "createdAt");

ALTER TABLE "PaymentLink"
  ADD CONSTRAINT "PaymentLink_merchantId_fkey"
  FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PaymentLink"
  ADD CONSTRAINT "PaymentLink_recoveryCaseId_fkey"
  FOREIGN KEY ("recoveryCaseId") REFERENCES "RecoveryCase"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PaymentLink"
  ADD CONSTRAINT "PaymentLink_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
