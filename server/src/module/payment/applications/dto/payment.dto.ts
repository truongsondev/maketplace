export type VnpLocale = 'vn' | 'en';

export interface CreatePaymentUrlCommand {
  userId: string;
  amount: number;
  orderInfo: string;
  locale: VnpLocale;
  orderType: string;
  bankCode?: string;
}

export interface CreatePaymentUrlResult {
  orderId: string;
  orderCode: string;
  paymentUrl: string;
  expiredAt: string;
}

export interface VnpReturnResult {
  isValidSignature: boolean;
  orderCode?: string;
  amount?: number;
  responseCode?: string;
  transactionStatus?: string;
  bankCode?: string;
  payDate?: string;
  message: string;
}

export interface VnpIpnResult {
  RspCode: string;
  Message: string;
}

export interface PaymentStatusResult {
  orderId: string;
  orderCode: string;
  amount: number;
  status: 'PENDING' | 'PAID' | 'FAILED';
  bankCode?: string;
  vnpTransactionNo?: string;
  vnpResponseCode?: string;
  vnpTransactionStatus?: string;
  paidAt?: string;
}

export interface ParsedVnpParams {
  [key: string]: string | undefined;
}
