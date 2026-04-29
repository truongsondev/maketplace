import type { Prisma, PrismaClient } from '@/generated/prisma/client';
import type { RefundStatus } from '@/generated/prisma/enums';
import { BadRequestError } from '../../../../../error-handlling/badRequestError';
import { NotFoundError } from '../../../../../error-handlling/notFoundError';
import type {
  AdminRefundDetail,
  AdminRefundSummary,
  ListAdminRefundsCommand,
} from '../../applications/dto/admin-refund.dto';
import type { IAdminRefundRepository } from '../../applications/ports/output/admin-refund.repository';

function toSummary(row: {
  id: string;
  orderId: string;
  type: 'CANCEL_REFUND' | 'RETURN_REFUND';
  status: RefundStatus;
  amount: Prisma.Decimal;
  currency: string;
  provider: string | null;
  providerRefundId: string | null;
  retryCount: number;
  failureReason: string | null;
  requestedAt: Date;
  processedAt: Date | null;
  initiatedBy: 'ADMIN' | 'USER' | 'SYSTEM';
  order: {
    status: string;
    user: { id: string; email: string | null; phone: string | null };
    payment: { status: string; method: string | null } | null;
    paymentTransaction: { orderCode: string } | null;
  };
}): AdminRefundSummary {
  return {
    id: row.id,
    orderId: row.orderId,
    orderStatus: row.order.status,
    type: row.type,
    status: row.status,
    amount: row.amount.toString(),
    currency: row.currency,
    provider: row.provider,
    providerRefundId: row.providerRefundId,
    retryCount: row.retryCount,
    failureReason: row.failureReason,
    requestedAt: row.requestedAt,
    processedAt: row.processedAt,
    initiatedBy: row.initiatedBy,
    user: row.order.user,
    payment: {
      status: row.order.payment?.status ?? null,
      method: row.order.payment?.method ?? null,
      orderCode: row.order.paymentTransaction?.orderCode ?? null,
    },
  };
}

export class PrismaAdminRefundRepository implements IAdminRefundRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listRefunds(params: ListAdminRefundsCommand) {
    const search = params.search?.trim();

    const where: Prisma.RefundTransactionWhereInput = {
      ...(params.status ? { status: params.status } : {}),
      ...(params.type ? { type: params.type } : {}),
      ...(params.from || params.to
        ? {
            requestedAt: {
              ...(params.from ? { gte: params.from } : {}),
              ...(params.to ? { lt: params.to } : {}),
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              { id: { contains: search } },
              { orderId: { contains: search } },
              { providerRefundId: { contains: search } },
              { order: { user: { email: { contains: search } } } },
              { order: { paymentTransaction: { orderCode: { contains: search } } } },
            ],
          }
        : {}),
    };

    const sortOrder = params.sortOrder === 'asc' ? 'asc' : 'desc';
    const orderBy: Prisma.RefundTransactionOrderByWithRelationInput =
      params.sortBy === 'amount'
        ? { amount: sortOrder }
        : params.sortBy === 'processedAt'
          ? { processedAt: sortOrder }
          : { requestedAt: sortOrder };

    const skip = (params.page - 1) * params.limit;

    const [rows, total, pending, success, failed, retrying] = await Promise.all([
      this.prisma.refundTransaction.findMany({
        where,
        skip,
        take: params.limit,
        orderBy,
        include: {
          order: {
            select: {
              status: true,
              user: { select: { id: true, email: true, phone: true } },
              payment: { select: { status: true, method: true } },
              paymentTransaction: { select: { orderCode: true } },
            },
          },
        },
      }),
      this.prisma.refundTransaction.count({ where }),
      this.prisma.refundTransaction.count({ where: { ...where, status: 'PENDING' } }),
      this.prisma.refundTransaction.count({ where: { ...where, status: 'SUCCESS' } }),
      this.prisma.refundTransaction.count({ where: { ...where, status: 'FAILED' } }),
      this.prisma.refundTransaction.count({ where: { ...where, status: 'RETRYING' } }),
    ]);

    return {
      items: rows.map((row) => toSummary(row)),
      total,
      aggregations: { pending, success, failed, retrying },
    };
  }

  async getRefundById(refundId: string): Promise<AdminRefundDetail | null> {
    const row = await this.prisma.refundTransaction.findUnique({
      where: { id: refundId },
      include: {
        order: {
          select: {
            status: true,
            user: { select: { id: true, email: true, phone: true } },
            payment: { select: { status: true, method: true } },
            paymentTransaction: { select: { orderCode: true } },
          },
        },
      },
    });

    if (!row) {
      return null;
    }

    return {
      ...toSummary(row),
      idempotencyKey: row.idempotencyKey,
      reason: row.reason,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async retryRefund(params: {
    refundId: string;
    actorAdminId: string;
  }): Promise<AdminRefundDetail> {
    const existing = await this.prisma.refundTransaction.findUnique({
      where: { id: params.refundId },
      include: {
        order: {
          select: {
            id: true,
            payment: { select: { id: true, status: true } },
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundError('Refund not found');
    }

    if (
      !existing.order.payment ||
      (existing.order.payment.status !== 'PAID' && existing.order.payment.status !== 'SUCCESS')
    ) {
      throw new BadRequestError('Only paid orders can be refunded');
    }

    const providerRefundId =
      existing.providerRefundId ?? `manual-${existing.id.slice(0, 8)}-${Date.now()}`;

    const updated = await this.prisma.$transaction(async (tx) => {
      const nextRetryCount = existing.retryCount + 1;

      const refund = await tx.refundTransaction.update({
        where: { id: params.refundId },
        data: {
          status: 'SUCCESS',
          provider: existing.provider ?? 'MANUAL',
          providerRefundId,
          processedAt: new Date(),
          failureReason: null,
          retryCount: nextRetryCount,
          initiatedBy: 'ADMIN',
        },
        include: {
          order: {
            select: {
              status: true,
              user: { select: { id: true, email: true, phone: true } },
              payment: { select: { status: true, method: true } },
              paymentTransaction: { select: { orderCode: true } },
            },
          },
        },
      });

      await tx.payment.update({
        where: { id: existing.order.payment!.id },
        data: { status: 'REFUNDED' },
      });

      return refund;
    });

    return {
      ...toSummary(updated),
      idempotencyKey: updated.idempotencyKey,
      reason: updated.reason,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }
}
