export type PaymentTransactionStatus = 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED';

export interface PaymentTransactionRecord {
  orderId: string;
  orderCode: string;
  amount: number;
  status: PaymentTransactionStatus;
  bankCode: string | null;
  gatewayReference: string | null;
  gatewayCode: string | null;
  paidAt: Date | null;
}

export interface CreatePendingTransactionInput {
  userId: string;
  orderCode: string;
  amount: number;
  voucherCode?: string;
  cartItemIds?: string[];
}

export interface UpdateTransactionFromWebhookInput {
  orderCode: string;
  status: PaymentTransactionStatus;
  paymentLinkId: string | null;
  gatewayReference: string | null;
  gatewayCode: string | null;
  bankCode: string | null;
  paidAt: Date | null;
  rawPayload: Record<string, unknown>;
}

export interface IPaymentRepository {
  createPendingTransaction(input: CreatePendingTransactionInput): Promise<{
    orderId: string;
    payableAmount: number;
    discountAmount: number;
    subtotalAmount: number;
    appliedVoucherCode?: string;
  }>;
  existsByOrderCode(orderCode: string): Promise<boolean>;
  findByOrderCode(orderCode: string): Promise<PaymentTransactionRecord | null>;
  setCheckoutReference(orderCode: string, paymentLinkId: string): Promise<void>;
  markCreateLinkFailed(orderCode: string, reason: string): Promise<void>;
  updateFromWebhookIfPending(input: UpdateTransactionFromWebhookInput): Promise<boolean>;
}
