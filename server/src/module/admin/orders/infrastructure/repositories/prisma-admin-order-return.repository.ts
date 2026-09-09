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
        where: { orderItemId: { in: itemIds }, status: 'RT_REQUESTED' },
        data: { status: 'RT_APPROVED' },
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
        where: { orderItemId: { in: itemIds }, status: 'RT_REQUESTED' },
        data: { status: 'RT_REJECTED' },
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

    if (order.returnStatus === 'SHIPPING') {
      return { orderId: order.id, orderStatus: order.status, returnStatus: order.returnStatus };
    }

    if (order.returnStatus !== 'APPROVED') {
      throw new BadRequestError('Return must be approved before marking as shipping');
    }

    const hasApprovedReturn = order.items.some((it) =>
      (it.returns ?? []).some((r) => r.status === 'RT_APPROVED'),
    );

    if (!hasApprovedReturn) {
      throw new BadRequestError('No approved return items found');
    }

    const returnStatus: ReturnFlowStatus = 'SHIPPING';

    await this.prisma.$transaction(async (tx) => {
      await tx.return.updateMany({
        where: { orderItemId: { in: order.items.map((it) => it.id) }, status: 'RT_APPROVED' },
        data: { status: 'RT_SHIPPING' },
      });

      await tx.order.update({
        where: { id: params.orderId },
        data: { returnStatus },
        select: { id: true },
      });
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
        subtotalPrice: true,
        returnStatus: true,
        payment: {
          select: {
            status: true,
          },
        },
        items: {
          select: {
            id: true,
            variantId: true,
            price: true,
            returns: {
              where: { status: { in: ['RT_APPROVED', 'RT_SHIPPING'] } },
              select: { quantity: true, requestType: true },
            },
          },
        },
        returnShipment: { select: { providerStatus: true, deliveredAt: true } },
      },
    });

    if (!order) {
      throw new BadRequestError('Order not found');
    }

    if (order.status !== 'DELIVERED') {
      throw new BadRequestError('Only delivered orders can be completed as returned');
    }

    if (order.returnStatus !== 'SHIPPING') {
      throw new BadRequestError('Return must be in SHIPPING status before completing');
    }
    if (!order.returnShipment || order.returnShipment.providerStatus !== 'delivered') {
      throw new BadRequestError('Vận đơn hoàn GHN chưa giao hàng về shop thành công');
    }

    const itemIds = order.items.map((it) => it.id);
    if (itemIds.length === 0) {
      throw new BadRequestError('Order has no items');
    }

    const refundableGross = order.items.reduce(
      (sum, item) =>
        sum +
        item.returns
          .filter((row) => row.requestType === 'RETURN_REFUND')
          .reduce((itemSum, row) => itemSum + Number(item.price) * row.quantity, 0),
      0,
    );
    const subtotal = Number(order.subtotalPrice);
    const paidTotal = Number(order.totalPrice);
    const refundableAmount =
      subtotal > 0 ? Math.min(paidTotal, Math.round((refundableGross / subtotal) * paidTotal)) : 0;

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.return.updateMany({
        where: { orderItemId: { in: itemIds }, status: { in: ['RT_APPROVED', 'RT_SHIPPING'] } },
        data: { status: 'RT_COMPLETED' },
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

      for (const item of order.items) {
        if (!item.variantId) continue;
        const returnedQuantity = item.returns.reduce((sum, row) => sum + row.quantity, 0);
        if (returnedQuantity <= 0) continue;
        const variant = await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stockOnHand: { increment: returnedQuantity } },
          select: { stockOnHand: true },
        });
        await tx.inventoryLog.create({
          data: {
            variantId: item.variantId,
            action: 'RETURN',
            quantity: returnedQuantity,
            beforeQuantity: variant.stockOnHand - returnedQuantity,
            afterQuantity: variant.stockOnHand,
            referenceType: 'ORDER_RETURN',
            referenceId: params.orderId,
            actorId: params.actorId,
            reason: 'GHN return shipment received at store',
            salesChannel: 'ONLINE',
          },
        });
      }

      await tx.orderStatusHistory.create({
        data: {
          orderId: params.orderId,
          oldStatus: 'DELIVERED',
          newStatus: 'RETURNED',
          changedBy: params.actorId,
          reason: 'GHN return shipment received at store',
        },
      });

      if (
        refundableAmount > 0 &&
        (order.payment?.status === 'PAID' || order.payment?.status === 'SUCCESS')
      ) {
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
            amount: refundableAmount,
            status: 'PENDING',
            initiatedBy: 'ADMIN',
            reason: 'Return completed by admin',
            idempotencyKey: `return-${params.orderId}`,
          },
          update: {
            amount: refundableAmount,
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
