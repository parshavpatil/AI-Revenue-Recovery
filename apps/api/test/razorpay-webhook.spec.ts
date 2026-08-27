import { createHmac } from 'crypto';
import { RazorpayWebhookService } from '../src/razorpay/razorpay-webhook.service';

describe('RazorpayWebhookService signature', () => {
  it('accepts a valid HMAC SHA256 signature', async () => {
    const secret = 'webhook-secret';
    const body = Buffer.from(JSON.stringify({ event: 'payment.failed' }));
    const signature = createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    const service = new RazorpayWebhookService(
      {
        get: (key: string) =>
          key === 'RAZORPAY_WEBHOOK_SECRET' ? secret : undefined,
      } as never,
      {} as never,
    );

    const result = await service.handleWebhook({
      rawBody: body,
      signature,
      eventId: 'evt_test_001',
    });

    expect(result.received).toBe(true);
  });
});
