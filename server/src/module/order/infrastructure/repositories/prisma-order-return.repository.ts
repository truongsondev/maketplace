import type { PrismaClient } from '@/generated/prisma/client';
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

    const order = await this.prisma.order.findFirst({
      where: { id: input.orderId, userId: input.userId },
      select: {
        id: true,
        status: true,
        returnStatus: true,
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
            status: 'REQUESTED',
          })),
        });
      }

      return {
        orderId: order.id,
        orderStatus: order.status,
        returnStatus: returnStatusToSet,
      } satisfies RequestReturnResult;
    });

    return updated;
  }
}
