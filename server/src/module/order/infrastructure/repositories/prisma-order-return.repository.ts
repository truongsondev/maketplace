import { Prisma, type PrismaClient } from '@/generated/prisma/client';
import type { ReturnFlowStatus } from '@/generated/prisma/enums';
import { BadRequestError } from '../../../../error-handlling/badRequestError';
import type {
  IOrderReturnRepository,
  RequestReturnInput,
  RequestReturnResult,
} from '../../applications/ports/output/order-return.repository';

export class PrismaOrderReturnRepository implements IOrderReturnRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async requestReturn(input: RequestReturnInput): Promise<RequestReturnResult> {
    const safeReason = typeof input.reason === 'string' ? input.reason.trim().slice(0, 1000) : null;
    const safeEvidenceImages = input.evidenceImages
      .slice(0, 6)
      .map((image) => ({
        url: image.url.trim(),
        publicId:
          typeof image.publicId === 'string' && image.publicId.trim()
            ? image.publicId.trim()
            : null,
      }));

    const order = await this.prisma.order.findFirst({
      where: { id: input.orderId, userId: input.userId },
      select: {
        id: true,
        status: true,
        returnStatus: true,
        totalPrice: true,
        deliveredAt: true,
        paymentTransaction: { select: { orderCode: true } },
        items: { select: { id: true, productId: true, variantId: true, quantity: true } },
      },
    });

    if (!order) {
      throw new BadRequestError('Order not found');
    }

    if (order.status !== 'DELIVERED') {
      throw new BadRequestError('Only delivered orders can be returned');
    }

    if (order.items.length === 0) {
      throw new BadRequestError('Order has no items');
    }

    if (!order.deliveredAt) {
      throw new BadRequestError('Delivered timestamp is missing');
    }
    const returnDeadline = new Date(order.deliveredAt);
    returnDeadline.setDate(returnDeadline.getDate() + 14);
    if (new Date() > returnDeadline) {
      throw new BadRequestError('The 14-day return period has expired');
    }

    const orderItemsById = new Map(order.items.map((item) => [item.id, item]));
    const requestedItems = input.items.map((requested) => {
      const orderItem = orderItemsById.get(requested.orderItemId);
      if (!orderItem) throw new BadRequestError('Order item does not belong to this order');
      if (requested.quantity > orderItem.quantity) {
        throw new BadRequestError('Return quantity exceeds purchased quantity');
      }
      return { ...requested, orderItem };
    });

    const returnStatusToSet: ReturnFlowStatus = 'REQUESTED';

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: input.orderId },
        data: { returnStatus: returnStatusToSet },
        select: { id: true },
      });

      const requestedItemIds = requestedItems.map((item) => item.orderItemId);
      const existingReturns = await tx.return.findMany({
        where: { orderItemId: { in: requestedItemIds }, status: { not: 'RT_REJECTED' } },
        select: { orderItemId: true, quantity: true },
      });
      const existingQuantity = new Map<string, number>();
      for (const existing of existingReturns) {
        existingQuantity.set(
          existing.orderItemId,
          (existingQuantity.get(existing.orderItemId) ?? 0) + existing.quantity,
        );
      }
      for (const requested of requestedItems) {
        if ((existingQuantity.get(requested.orderItemId) ?? 0) + requested.quantity > requested.orderItem.quantity) {
          throw new BadRequestError('Cumulative return quantity exceeds purchased quantity');
        }
      }

      if (input.requestType === 'EXCHANGE') {
        for (const requested of requestedItems) {
          const target = await tx.productVariant.findFirst({
            where: {
              id: requested.requestedVariantId ?? '',
              productId: requested.orderItem.productId,
              status: 'ACTIVE',
              isDeleted: false,
              stockAvailable: { gte: requested.quantity },
            },
            select: { id: true },
          });
          if (!target) throw new BadRequestError('Requested exchange variant is unavailable');
        }
      }

      await tx.return.createMany({
          data: requestedItems.map((requested) => ({
            orderItemId: requested.orderItemId,
            quantity: requested.quantity,
            requestType: input.requestType,
            requestedVariantId: requested.requestedVariantId ?? null,
            reason: safeReason,
            reasonCode: input.reasonCode,
            evidenceImages: safeEvidenceImages as Prisma.InputJsonValue,
            bankAccountName: input.bankAccountName,
            bankAccountNumber: input.bankAccountNumber,
            bankName: input.bankName,
            status: 'RT_REQUESTED',
          })),
      });

      const admins = await tx.userRole.findMany({
        where: { role: { code: 'ADMIN' } },
        select: { userId: true },
        distinct: ['userId'],
      });

      const orderLabel = order.paymentTransaction?.orderCode ?? order.id;
      if (admins.length > 0) {
        await tx.notification.createMany({
          data: admins.map((admin) => ({
            userId: admin.userId,
            content: `[ORDER_RETURN|${order.id}] Đơn hàng #${orderLabel} có yêu cầu trả hàng/hoàn tiền mới.`,
            isRead: false,
          })),
        });
      }

      await tx.auditLog.create({
        data: {
          actorType: 'USER',
          actorId: input.userId,
          targetType: 'Order',
          targetId: input.orderId,
          action: 'USER_ORDER_RETURN_REQUESTED',
          oldData: { returnStatus: order.returnStatus ?? null } as Prisma.InputJsonValue,
          newData: {
            returnStatus: returnStatusToSet,
            requestType: input.requestType,
            items: requestedItems.map((item) => ({
              orderItemId: item.orderItemId,
              quantity: item.quantity,
              requestedVariantId: item.requestedVariantId ?? null,
            })),
            reasonCode: input.reasonCode,
            reason: safeReason,
            evidenceImages: safeEvidenceImages,
            adminReceivers: admins.length,
          } as Prisma.InputJsonValue,
        },
      });

      return {
        orderId: order.id,
        orderStatus: order.status,
        returnStatus: returnStatusToSet,
      } satisfies RequestReturnResult;
    });

    return updated;
  }
}
