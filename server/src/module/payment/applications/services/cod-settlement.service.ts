import { Prisma, type PrismaClient } from '@/generated/prisma/client';
import { BadRequestError } from '../../../../error-handlling/badRequestError';
import type { VoucherCheckoutService } from '../../../voucher/applications/services/voucher-checkout.service';

export class CodSettlementService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly voucherCheckoutService: VoucherCheckoutService,
  ) {}

  async settleOnDelivery(
    orderId: string,
    actorId: string | null,
    actorType: 'ADMIN' | 'SYSTEM' = 'ADMIN',
  ): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        select: {
          status: true,
          payment: { select: { method: true, status: true } },
          items: { select: { variantId: true, quantity: true } },
        },
      });
      if (!order) throw new BadRequestError('Order not found');
      if (order.status === 'DELIVERED') return false;
      if (order.status !== 'SHIPPED') {
        throw new BadRequestError('COD can only be collected for a shipped order');
      }
      if (order.payment?.method !== 'COD') return false;
      if (order.payment.status === 'PAID' || order.payment.status === 'SUCCESS') return false;
      if (order.payment.status !== 'PENDING') {
        throw new BadRequestError(`COD payment cannot be settled from ${order.payment.status}`);
      }

      const paymentUpdated = await tx.payment.updateMany({
        where: { orderId, method: 'COD', status: 'PENDING' },
        data: { status: 'PAID', paidAt: new Date() },
      });
      if (paymentUpdated.count === 0) return false;

      const quantities = new Map<string, number>();
      for (const item of order.items) {
        if (!item.variantId) continue;
        quantities.set(item.variantId, (quantities.get(item.variantId) ?? 0) + item.quantity);
      }
      for (const [variantId, quantity] of quantities) {
        const current = await tx.productVariant.findUnique({
          where: { id: variantId },
          select: { stockOnHand: true },
        });
        if (!current) throw new BadRequestError(`Variant not found: ${variantId}`);
        const updated = await tx.productVariant.updateMany({
          where: { id: variantId, stockOnHand: { gte: quantity }, stockReserved: { gte: quantity } },
          data: { stockOnHand: { decrement: quantity }, stockReserved: { decrement: quantity } },
        });
        if (updated.count !== 1) {
          throw new BadRequestError(`Reserved stock is inconsistent for variant ${variantId}`);
        }
        await tx.inventoryLog.create({
          data: {
            variantId,
            action: 'SALE',
            quantity,
            beforeQuantity: current.stockOnHand,
            afterQuantity: current.stockOnHand - quantity,
            referenceType: 'ORDER',
            referenceId: orderId,
            actorId,
            reason: 'COD collected on delivery',
            salesChannel: 'ONLINE',
          },
        });
      }

      await this.voucherCheckoutService.recordPromotionUsageForPaidOrder?.(tx, orderId);
      await this.voucherCheckoutService.recordUsageForPaidOrder(tx, orderId);
      await tx.auditLog.create({
        data: {
          actorType,
          actorId,
          targetType: 'Order',
          targetId: orderId,
          action: 'COD_PAYMENT_COLLECTED',
          newData: { paymentStatus: 'PAID' } as Prisma.InputJsonValue,
        },
      });
      return true;
    });
  }
}
