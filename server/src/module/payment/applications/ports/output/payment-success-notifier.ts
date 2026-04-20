export interface PaymentSuccessNotification {
  orderId: string;
  orderCode: string;
  amount: number;
  paidAt: Date;
}

export interface IPaymentSuccessNotifier {
  notify(input: PaymentSuccessNotification): Promise<void>;
}
