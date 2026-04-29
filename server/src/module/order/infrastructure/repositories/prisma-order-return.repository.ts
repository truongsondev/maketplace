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
        paymentTransaction: { select: { orderCode: true } },
        items: { select: { id: true, quantity: true } },
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

    const returnStatusToSet: ReturnFlowStatus = 'REQUESTED';

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: input.orderId },
        data: { returnStatus: returnStatusToSet },
        select: { id: true },
      });

      const existingReturns = await tx.return.findMany({
        where: { orderItemId: { in: order.items.map((it) => it.id) } },
        select: { orderItemId: true },
      });
      const existingItemIds = new Set(existingReturns.map((r) => r.orderItemId));

      const itemsToCreate = order.items.filter((it) => !existingItemIds.has(it.id));
      if (itemsToCreate.length > 0) {
        await tx.return.createMany({
          data: itemsToCreate.map((it) => ({
            orderItemId: it.id,
            quantity: it.quantity,
            reason: safeReason,
            reasonCode: input.reasonCode,
            evidenceImages: safeEvidenceImages as Prisma.InputJsonValue,
            bankAccountName: input.bankAccountName,
            bankAccountNumber: input.bankAccountNumber,
            bankName: input.bankName,
            status: 'RT_REQUESTED',
          })),
        });
      }

      if (existingItemIds.size > 0) {
        await tx.return.updateMany({
          where: { orderItemId: { in: Array.from(existingItemIds) }, status: 'RT_REQUESTED' },
          data: {
            reason: safeReason,
            reasonCode: input.reasonCode,
            evidenceImages: safeEvidenceImages as Prisma.InputJsonValue,
            bankAccountName: input.bankAccountName,
            bankAccountNumber: input.bankAccountNumber,
            bankName: input.bankName,
          },
        });
      }

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
            content: `[ORDER_RETURN|${order.id}] Don hang #${orderLabel} co yeu cau tra hang/hoan tien moi.`,
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
            reasonCode: input.reasonCode,
            reason: safeReason,
            evidenceImages: safeEvidenceImages,
            bankName: input.bankName,
            amount: order.totalPrice,
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
