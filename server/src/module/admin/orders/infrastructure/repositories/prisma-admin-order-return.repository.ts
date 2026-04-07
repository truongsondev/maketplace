import type { PrismaClient } from '@/generated/prisma/client';
import type { ReturnFlowStatus } from '@/generated/prisma/enums';
import { BadRequestError } from '../../../../../error-handlling/badRequestError';
import type {
  AdminReturnStatusResult,
  IAdminOrderReturnRepository,
} from '../../applications/ports/output/admin-order-return.repository';

export class PrismaAdminOrderReturnRepository implements IAdminOrderReturnRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async approveReturns(params: {
    orderId: string;
    actorId: string;
  }): Promise<AdminReturnStatusResult> {
    const order = await this.prisma.order.findUnique({
      where: { id: params.orderId },
      select: { id: true, status: true, items: { select: { id: true } } },
    });

    if (!order) {
      throw new BadRequestError('Order not found');
    }

    const itemIds = order.items.map((it) => it.id);
    if (itemIds.length === 0) {
      throw new BadRequestError('Order has no items');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.return.updateMany({
        where: { orderItemId: { in: itemIds }, status: 'REQUESTED' },
        data: { status: 'APPROVED' },
      });

      const returnStatus: ReturnFlowStatus = 'WAITING_PICKUP';
      await tx.order.update({
        where: { id: params.orderId },
        data: { returnStatus },
        select: { id: true },
      });

      return {
        orderId: order.id,
        orderStatus: order.status,
        returnStatus,
      } satisfies AdminReturnStatusResult;
    });

    return updated;
  }

  async rejectReturns(params: {
    orderId: string;
    actorId: string;
  }): Promise<AdminReturnStatusResult> {
    const order = await this.prisma.order.findUnique({
      where: { id: params.orderId },
      select: { id: true, status: true, items: { select: { id: true } } },
    });

    if (!order) {
      throw new BadRequestError('Order not found');
    }

    const itemIds = order.items.map((it) => it.id);
    if (itemIds.length === 0) {
      throw new BadRequestError('Order has no items');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.return.updateMany({
        where: { orderItemId: { in: itemIds }, status: 'REQUESTED' },
        data: { status: 'REJECTED' },
      });

      const returnStatus: ReturnFlowStatus = 'REJECTED';
      await tx.order.update({
        where: { id: params.orderId },
        data: { returnStatus },
        select: { id: true },
      });

      return {
        orderId: order.id,
        orderStatus: order.status,
        returnStatus,
      } satisfies AdminReturnStatusResult;
    });

    return updated;
  }

  async markReturnPickedUp(params: {
    orderId: string;
    actorId: string;
  }): Promise<AdminReturnStatusResult> {
    const order = await this.prisma.order.findUnique({
      where: { id: params.orderId },
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

    if (order.returnStatus === 'RETURNING') {
      return { orderId: order.id, orderStatus: order.status, returnStatus: order.returnStatus };
    }

    if (order.returnStatus !== 'WAITING_PICKUP') {
      throw new BadRequestError('Return must be approved and waiting for pickup first');
    }

    const hasApprovedReturn = order.items.some((it) =>
      (it.returns ?? []).some((r) => r.status === 'APPROVED'),
    );

    if (!hasApprovedReturn) {
      throw new BadRequestError('No approved return items found');
    }

    const returnStatus: ReturnFlowStatus = 'RETURNING';

    await this.prisma.order.update({
      where: { id: params.orderId },
      data: { returnStatus },
      select: { id: true },
    });

    return { orderId: order.id, orderStatus: order.status, returnStatus };
  }

  async completeReturn(params: {
    orderId: string;
    actorId: string;
  }): Promise<AdminReturnStatusResult> {
    const order = await this.prisma.order.findUnique({
      where: { id: params.orderId },
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

    if (order.status === 'RETURNED' && order.returnStatus === 'COMPLETED') {
      return { orderId: order.id, orderStatus: order.status, returnStatus: order.returnStatus };
    }

    if (order.status !== 'DELIVERED') {
      throw new BadRequestError('Only delivered orders can be completed as returned');
    }

    if (order.returnStatus !== 'RETURNING') {
      throw new BadRequestError('Return must be in RETURNING status before completing');
    }

    const itemIds = order.items.map((it) => it.id);
    if (itemIds.length === 0) {
      throw new BadRequestError('Order has no items');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.return.updateMany({
        where: { orderItemId: { in: itemIds }, status: 'APPROVED' },
        data: { status: 'COMPLETED' },
      });

      const returnStatus: ReturnFlowStatus = 'COMPLETED';
      const updatedOrder = await tx.order.update({
        where: { id: params.orderId },
        data: {
          status: 'RETURNED',
          returnStatus,
        },
        select: { id: true, status: true, returnStatus: true },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: params.orderId,
          oldStatus: order.status,
          newStatus: 'RETURNED',
          changedBy: params.actorId,
        },
      });

      return {
        orderId: updatedOrder.id,
        orderStatus: updatedOrder.status,
        returnStatus: updatedOrder.returnStatus,
      } satisfies AdminReturnStatusResult;
    });

    return updated;
  }
}
