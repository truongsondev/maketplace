export interface CreatePayosPaymentLinkCommand {
  userId: string;
  amount: number;
  description?: string;
  voucherCode?: string;
  cartItemIds?: string[];
  shipping?: {
    recipient: string;
    phone: string;
    addressLine: string;
    ward: string;
    district: string;
    city: string;
    addressId?: string | null;
  };
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
  dbStatus?: 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED';
  message: string;
}

export interface PaymentStatusResult {
  orderId: string;
  orderCode: string;
  amount: number;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED';
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
