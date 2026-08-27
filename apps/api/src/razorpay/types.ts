export type RazorpayPaymentLinkResponse = {
  id: string;
  entity: 'payment_link';
  amount: number;
  currency: string;
  status: string;
  short_url: string;
  reference_id?: string;
  description?: string;
  customer?: {
    name?: string;
    contact?: string;
    email?: string;
  };
  expire_by?: number;
};

export type RazorpayWebhookEvent = {
  entity?: string;
  account_id?: string;
  event?: string;
  contains?: string[];
  payload?: Record<string, unknown>;
  created_at?: number;
};
