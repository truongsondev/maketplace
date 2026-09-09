import type { OrderStatus } from '@/generated/prisma/enums';

export type OrderItemWithOrder = {
  id: string;
  productId: string;
  variantId: string | null;
  orderId: string;
  order: {
    id: string;
    userId: string;
    status: OrderStatus;
  };
};

export type OrderWithItems = {
  id: string;
  userId: string;
  status: OrderStatus;
  items: Array<{ id: string }>;
};

export interface IOrderItemRepository {
  findByIdWithOrder(orderItemId: string): Promise<OrderItemWithOrder | null>;
  findOrderWithItemsForUser(orderId: string, userId: string): Promise<OrderWithItems | null>;
}
