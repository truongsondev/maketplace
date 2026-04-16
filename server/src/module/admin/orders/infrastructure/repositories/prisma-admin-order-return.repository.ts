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

      const returnStatus: ReturnFlowStatus = 'APPROVED';
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

    if (order.returnStatus === 'SHIPPING' || order.returnStatus === 'RETURNING') {
      return { orderId: order.id, orderStatus: order.status, returnStatus: order.returnStatus };
    }

    if (order.returnStatus !== 'APPROVED' && order.returnStatus !== 'WAITING_PICKUP') {
      throw new BadRequestError('Return must be approved before marking as shipping');
    }

    const hasApprovedReturn = order.items.some((it) =>
      (it.returns ?? []).some((r) => r.status === 'APPROVED'),
    );

    if (!hasApprovedReturn) {
      throw new BadRequestError('No approved return items found');
    }

    const returnStatus: ReturnFlowStatus = 'SHIPPING';

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
        totalPrice: true,
        returnStatus: true,
        payment: {
          select: {
            status: true,
          },
        },
        items: { select: { id: true } },
      },
    });

    if (!order) {
      throw new BadRequestError('Order not found');
    }

    if (order.status !== 'DELIVERED') {
      throw new BadRequestError('Only delivered orders can be completed as returned');
    }

    if (order.returnStatus !== 'SHIPPING' && order.returnStatus !== 'RETURNING') {
      throw new BadRequestError('Return must be in SHIPPING status before completing');
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
          returnStatus,
        },
        select: { id: true, status: true, returnStatus: true },
      });

      if (order.payment?.status === 'PAID' || order.payment?.status === 'SUCCESS') {
        await tx.refundTransaction.upsert({
          where: {
            orderId_type: {
              orderId: params.orderId,
              type: 'RETURN_REFUND',
            },
          },
          create: {
            orderId: params.orderId,
            type: 'RETURN_REFUND',
            amount: order.totalPrice,
            status: 'PENDING',
            initiatedBy: 'ADMIN',
            reason: 'Return completed by admin',
            idempotencyKey: `return-${params.orderId}`,
          },
          update: {
            reason: 'Return completed by admin',
          },
        });
      }

      return {
        orderId: updatedOrder.id,
        orderStatus: updatedOrder.status,
        returnStatus: updatedOrder.returnStatus,
      } satisfies AdminReturnStatusResult;
    });

    return updated;
  }
}
