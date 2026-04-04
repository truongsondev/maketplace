export interface CreatePayosPaymentLinkCommand {
  userId: string;
  amount: number;
  description?: string;
}

export interface CreatePayosPaymentLinkResult {
  orderId: string;
  orderCode: string;
  checkoutUrl: string;
  qrCode: string;
  paymentLinkId: string;
  status: string;
  expiredAt?: number;
}

export interface PayosReturnResult {
  orderCode: string;
  amount: number;
  amountPaid: number;
  amountRemaining: number;
  paymentLinkId: string;
  gatewayStatus: string;
  dbStatus?: 'PENDING' | 'PAID' | 'FAILED';
  message: string;
}

export interface PaymentStatusResult {
  orderId: string;
  orderCode: string;
  amount: number;
  status: 'PENDING' | 'PAID' | 'FAILED';
  bankCode?: string;
  gatewayReference?: string;
  gatewayCode?: string;
  paidAt?: string;
}

export interface HandlePayosWebhookResult {
  processed: boolean;
  orderCode: string;
  status: 'PAID' | 'FAILED';
}
