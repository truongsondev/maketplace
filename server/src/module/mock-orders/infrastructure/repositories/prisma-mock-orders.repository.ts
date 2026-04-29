import type { PrismaClient } from '@/generated/prisma/client';
import type { OrderStatus, ReturnFlowStatus } from '@/generated/prisma/enums';
import { BadRequestError } from '../../../../error-handlling/badRequestError';
import type {
  IMockOrdersRepository,
  OrderTransitionResult,
} from '../../applications/ports/output/mock-orders.repository';

export class PrismaMockOrdersRepository implements IMockOrdersRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async markDelivered(orderId: string): Promise<OrderTransitionResult> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true, returnStatus: true },
    });

    if (!order) {
      throw new BadRequestError('Order not found');
    }

    if (order.status === 'DELIVERED') {
      return { id: order.id, status: order.status, returnStatus: order.returnStatus ?? null };
    }

    if (order.status !== 'SHIPPED') {
      throw new BadRequestError('Only shipped orders can be marked as delivered');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: 'DELIVERED' },
        select: { id: true, status: true, returnStatus: true },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          oldStatus: order.status,
          newStatus: 'DELIVERED',
          changedBy: null,
        },
      });

      return {
        id: updatedOrder.id,
        status: updatedOrder.status,
        returnStatus: updatedOrder.returnStatus ?? null,
      } satisfies OrderTransitionResult;
    });

    return updated;
  }

  async markReturnPickedUp(orderId: string): Promise<OrderTransitionResult> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        returnStatus: true,
        items: { select: { id: true, returns: { select: { status: true } } } },
      },
    });

    if (!order) {
      throw new BadRequestError('Order not found');
    }

    if (order.returnStatus === 'SHIPPING') {
      return { id: order.id, status: order.status, returnStatus: order.returnStatus };
    }

    if (order.returnStatus !== 'APPROVED') {
      throw new BadRequestError('Return must be approved before marking as shipping');
    }

    const hasApprovedReturn = (order.items ?? []).some((it) =>
      (it.returns ?? []).some((r) => r.status === 'RT_APPROVED'),
    );

    if (!hasApprovedReturn) {
      throw new BadRequestError('No approved return items found');
    }

    const returnStatus: ReturnFlowStatus = 'SHIPPING';

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.return.updateMany({
        where: {
          orderItemId: { in: (order.items ?? []).map((it) => it.id) },
          status: 'RT_APPROVED',
        },
        data: { status: 'RT_SHIPPING' },
      });

      return tx.order.update({
        where: { id: orderId },
        data: { returnStatus },
        select: { id: true, status: true, returnStatus: true },
      });
    });

    return {
      id: updated.id,
      status: updated.status,
      returnStatus: updated.returnStatus ?? null,
    } satisfies OrderTransitionResult;
  }

  async completeReturn(orderId: string): Promise<OrderTransitionResult> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        returnStatus: true,
        items: { select: { id: true } },
      },
    });

    if (!order) {
      throw new BadRequestError('Order not found');
    }

    if (order.status !== 'DELIVERED') {
      throw new BadRequestError('Only delivered orders can be completed as returned');
    }

    if (order.returnStatus !== 'SHIPPING') {
      throw new BadRequestError('Return must be SHIPPING before completing');
    }

    const itemIds = order.items.map((it) => it.id);
    if (itemIds.length === 0) {
      throw new BadRequestError('Order has no items');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.return.updateMany({
        where: { orderItemId: { in: itemIds }, status: { in: ['RT_APPROVED', 'RT_SHIPPING'] } },
        data: { status: 'RT_COMPLETED' },
      });

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          returnStatus: 'COMPLETED',
        },
        select: { id: true, status: true, returnStatus: true },
      });

      return {
        id: updatedOrder.id,
        status: updatedOrder.status,
        returnStatus: updatedOrder.returnStatus ?? null,
      } satisfies OrderTransitionResult;
    });

    return updated;
  }
}
