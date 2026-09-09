import type { PrismaClient } from '@/generated/prisma/client';
import type {
  IOrderItemRepository,
  OrderItemWithOrder,
  OrderWithItems,
} from '../../applications/ports/output/order-item.repository';

export class PrismaOrderItemRepository implements IOrderItemRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByIdWithOrder(orderItemId: string): Promise<OrderItemWithOrder | null> {
    return this.prisma.orderItem.findUnique({
      where: { id: orderItemId },
      select: {
        id: true,
        productId: true,
        variantId: true,
        orderId: true,
        order: {
          select: {
            id: true,
            userId: true,
            status: true,
          },
        },
      },
    });
  }

  async findOrderWithItemsForUser(orderId: string, userId: string): Promise<OrderWithItems | null> {
    return this.prisma.order.findFirst({
      where: { id: orderId, userId },
      select: {
        id: true,
        userId: true,
        status: true,
        items: {
          select: { id: true },
        },
      },
    });
  }
}
