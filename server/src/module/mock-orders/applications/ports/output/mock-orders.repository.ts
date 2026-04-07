import type { OrderStatus, ReturnFlowStatus } from '@/generated/prisma/enums';

export interface OrderTransitionResult {
  id: string;
  status: OrderStatus;
  returnStatus: ReturnFlowStatus | null;
}

export interface IMockOrdersRepository {
  markDelivered(orderId: string): Promise<OrderTransitionResult>;
  markReturnPickedUp(orderId: string): Promise<OrderTransitionResult>;
  completeReturn(orderId: string): Promise<OrderTransitionResult>;
}
