import {
  PrismaClient,
  PaymentFailureCategory,
  PaymentMethod,
  PaymentStatus,
  RecoveryPriority,
  RecoveryCaseStatus,
  UserRole,
} from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const merchant = await prisma.merchant.upsert({
    where: { razorpayAccountId: 'demo_merchant_001' },
    update: {},
    create: {
      name: 'RecoverAI Demo Merchant',
      razorpayAccountId: 'demo_merchant_001',
      timezone: 'Asia/Kolkata',
      policies: {
        create: {
          name: 'Default Recovery Policy',
          description: 'Safe demo policy for the RecoverAI recovery engine.',
          maxRetryAttempts: 2,
          maxVoiceAttempts: 2,
          minRecoveryScore: 0.65,
          callingStartHour: 9,
          callingEndHour: 20,
          config: {
            allowRetry: true,
            allowPaymentLink: true,
            allowVoice: true,
            requireVoiceOptIn: true
          }
        }
      }
    },
    include: {
      policies: true
    }
  });

  await prisma.user.upsert({
    where: {
      merchantId_email: {
        merchantId: merchant.id,
        email: 'demo@recoverai.local'
      }
    },
    update: {},
    create: {
      merchantId: merchant.id,
      email: 'demo@recoverai.local',
      name: 'Demo Operator',
      role: UserRole.OWNER
    }
  });

  const customer = await prisma.customer.upsert({
    where: {
      merchantId_externalCustomerId: {
        merchantId: merchant.id,
        externalCustomerId: 'cust_demo_001'
      }
    },
    update: {},
    create: {
      merchantId: merchant.id,
      externalCustomerId: 'cust_demo_001',
      name: 'Rahul Sharma',
      email: 'rahul@example.com',
      phone: '+919999999999',
      preferredLanguage: 'hinglish',
      voiceOptIn: true,
      lifetimeValue: 42000,
      successfulPayments: 8,
      failedPayments: 1
    }
  });

  const payment = await prisma.payment.upsert({
    where: {
      razorpayPaymentId: 'pay_demo_failed_001'
    },
    update: {},
    create: {
      merchantId: merchant.id,
      customerId: customer.id,
      razorpayPaymentId: 'pay_demo_failed_001',
      razorpayOrderId: 'order_demo_001',
      amount: 4999,
      currency: 'INR',
      status: PaymentStatus.FAILED,
      method: PaymentMethod.UPI,
      failureCategory: PaymentFailureCategory.INSUFFICIENT_FUNDS,
      failureCode: 'BANK_DECLINED',
      failureReason: 'Payment was declined by the bank.',
      failedAt: new Date()
    }
  });

  const recoveryCase = await prisma.recoveryCase.upsert({
    where: {
      id: 'recovery_demo_001'
    },
    update: {},
    create: {
      id: 'recovery_demo_001',
      merchantId: merchant.id,
      customerId: customer.id,
      paymentId: payment.id,
      status: RecoveryCaseStatus.OPEN,
      priority: RecoveryPriority.HIGH,
      failureCategory: PaymentFailureCategory.INSUFFICIENT_FUNDS,
      revenueAtRisk: 4999,
      recoveryProbability: 0.84,
      expectedRecovery: 4199.16,
      aiSummary: 'High-value repeat customer with a historically strong payment record.'
    }
  });

  console.log('Seed completed.');
  console.log({
    merchantId: merchant.id,
    customerId: customer.id,
    paymentId: payment.id,
    recoveryCaseId: recoveryCase.id
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
