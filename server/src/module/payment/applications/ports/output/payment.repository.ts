export type PaymentTransactionStatus = 'PENDING' | 'PAID' | 'FAILED';

export interface PaymentTransactionRecord {
  orderId: string;
  orderCode: string;
  amount: number;
  status: PaymentTransactionStatus;
  bankCode: string | null;
  vnpTransactionNo: string | null;
  vnpResponseCode: string | null;
  vnpTransactionStatus: string | null;
  paidAt: Date | null;
}

export interface CreatePendingTransactionInput {
  userId: string;
  orderCode: string;
  amount: number;
}

export interface UpdateTransactionFromIpnInput {
  orderCode: string;
  status: PaymentTransactionStatus;
  bankCode: string | null;
  vnpTransactionNo: string | null;
  vnpResponseCode: string | null;
  vnpTransactionStatus: string | null;
  paidAt: Date | null;
  rawPayload: Record<string, string>;
}

export interface IPaymentRepository {
  createPendingTransaction(input: CreatePendingTransactionInput): Promise<{ orderId: string }>;
  existsByOrderCode(orderCode: string): Promise<boolean>;
  findByOrderCode(orderCode: string): Promise<PaymentTransactionRecord | null>;
  updateFromIpnIfPending(input: UpdateTransactionFromIpnInput): Promise<boolean>;
}
