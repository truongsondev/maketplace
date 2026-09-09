export interface NewOrderNotification {
  orderId: string;
  orderCode: string;
  customerName?: string | null;
  totalAmount: number;
  createdAt: Date;
}

export interface INewOrderNotifier {
  notify(input: NewOrderNotification): Promise<void>;
}
