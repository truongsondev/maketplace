import type { Prisma, PrismaClient } from '@/generated/prisma/client';
import type { CancelReason, OrderStatus } from '@/generated/prisma/enums';
import { BadRequestError } from '../../../../error-handlling/badRequestError';
import { createLogger } from '../../../../shared/util/logger';
import { adminNotificationHub } from '../../../../module/admin/notifications/infrastructure/realtime/admin-notification-hub';
import type {
  CancelMyOrderResult,
  ConfirmReceivedResult,
  ListMyOrdersResult,
  MyOrderCountsResult,
  MyOrderDto,
  OrderSort,
  OrderTab,
  RequestPaidCancelResult,
} from '../../applications/dto/order.dto';
import type { IOrderRepository } from '../../applications/ports/output/order.repository';

function clampPositiveInt(value: unknown, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.floor(n);
}

function mapTabToStatuses(tab: OrderTab | undefined): OrderStatus[] | undefined {
  if (!tab || tab === 'all') return undefined;
  if (tab === 'pending') return ['PENDING'];
  if (tab === 'processing') return ['CONFIRMED', 'PAID'];
  if (tab === 'shipped') return ['SHIPPED'];
  if (tab === 'completed') return ['DELIVERED'];
  if (tab === 'canceled') return ['CANCELLED'];
  return undefined;
}

function pickPrimaryImageUrl(input: {
  variantImages?: Array<{ url: string; isPrimary: boolean; sortOrder: number }>;
  productImages?: Array<{ url: string; isPrimary: boolean; sortOrder: number }>;
}): string | null {
  const images = [...(input.variantImages ?? []), ...(input.productImages ?? [])];
  if (images.length === 0) return null;

  const sorted = images
    .slice()
    .sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0) || a.sortOrder - b.sortOrder);

  return sorted[0]?.url ?? null;
}

function safeAttributesToText(attributes: unknown): string {
  if (!attributes || typeof attributes !== 'object') return '';
  const entries = Object.entries(attributes as Record<string, unknown>)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .slice(0, 6);
  return entries.map(([k, v]) => `${k}: ${String(v)}`).join(' • ');
}

function mapCancelReasonCodeToText(code: CancelReason | null | undefined): string | null {
  if (!code) return null;
  if (code === 'NO_LONGER_NEEDED') return 'Khong con nhu cau mua';
  if (code === 'BUY_OTHER_ITEM') return 'Mua san pham khac';
  if (code === 'FOUND_CHEAPER') return 'Tim duoc noi ban re hon';
  if (code === 'OTHER') return 'Ly do khac';
  return null;
}

function extractReasonFromAuditNewData(payload: Prisma.JsonValue | null): string | null {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return null;
  }

  const reason = (payload as Record<string, unknown>).reason;
  if (typeof reason !== 'string') {
    return null;
  }

  const trimmed = reason.trim();
  return trimmed.length > 0 ? trimmed : null;
}

const logger = createLogger('PrismaOrderRepository');

function buildAdminCancelRequestContent(input: {
  orderId: string;
  orderCode: string | null;
  reasonCode: CancelReason;
  reasonText: string | null;
}): string {
  const label = input.orderCode?.trim() || input.orderId;
  const reason = input.reasonText?.trim() || String(input.reasonCode);
  return `Yeu cau huy don hang #${label} da duoc gui. Ly do: ${reason}`;
}

function buildOrderReceivedNotificationContent(input: {
  orderId: string;
  orderCode: string | null;
}): string {
  const label = input.orderCode?.trim() || input.orderId;
  return `[ORDER_RECEIVED|${input.orderId}] Don hang #${label} da duoc xac nhan nhan hang thanh cong.`;
}

export class PrismaOrderRepository implements IOrderRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listMyOrders(input: {
    userId: string;
    tab?: OrderTab;
    search?: string | null;
    sort?: OrderSort;
    page: number;
    limit: number;
  }): Promise<ListMyOrdersResult> {
    const userId = input.userId;
    if (!userId) {
      throw new BadRequestError('User ID not found');
    }
    console.log(
      'Listing orders for userId:',
      userId,
      'tab:',
      input.tab,
      'search:',
      input.search,
      'sort:',
      input.sort,
      'page:',
      input.page,
      'limit:',
      input.limit,
    );

    const tab = input.tab ?? 'all';
    const sort = input.sort ?? 'new';
    const search = input.search?.trim() || undefined;

    const page = clampPositiveInt(input.page, 1);
    const limit = Math.min(clampPositiveInt(input.limit, 10), 50);
    const skip = (page - 1) * limit;

    const statuses = mapTabToStatuses(tab);

    const where: Prisma.OrderWhereInput = {
      userId,
      ...(statuses ? { status: { in: statuses } } : {}),
      ...(search
        ? {
            OR: [
              { id: { contains: search } },
              { paymentTransaction: { orderCode: { contains: search } } },
            ],
          }
        : {}),
    };

    const orderBy: Prisma.OrderOrderByWithRelationInput =
      sort === 'old' ? { createdAt: 'asc' } : { createdAt: 'desc' };

    const [total, orders] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          createdAt: true,
          status: true,
          returnStatus: true,
          totalPrice: true,
          payment: { select: { method: true, status: true, paidAt: true } },
          paymentTransaction: { select: { status: true, orderCode: true, paidAt: true } },
          cancelRequest: {
            select: {
              id: true,
              status: true,
              reasonCode: true,
              reasonText: true,
              bankAccountName: true,
              bankAccountNumber: true,
              bankName: true,
              approvedAt: true,
              completedAt: true,
            },
          },
          refundTransactions: {
            select: {
              id: true,
              type: true,
              status: true,
              amount: true,
              requestedAt: true,
              processedAt: true,
              failureReason: true,
            },
            orderBy: { requestedAt: 'desc' },
            take: 1,
          },
          items: {
            select: {
              id: true,
              productId: true,
              variantId: true,
              quantity: true,
              price: true,
              product: {
                select: {
                  id: true,
                  name: true,
                  images: { select: { url: true, isPrimary: true, sortOrder: true } },
                },
              },
              variant: {
                select: {
                  id: true,
                  attributes: true,
                  images: { select: { url: true, isPrimary: true, sortOrder: true } },
                },
              },
            },
          },
        },
      }),
    ]);

    const cancelledOrderIds = orders.filter((o) => o.status === 'CANCELLED').map((o) => o.id);
    const deliveredOrderIds = orders.filter((o) => o.status === 'DELIVERED').map((o) => o.id);

    const [adminCancelLogs, receivedHistory] = await Promise.all([
      cancelledOrderIds.length > 0
        ? this.prisma.auditLog.findMany({
            where: {
              action: 'ADMIN_CANCEL_ORDER',
              targetId: { in: cancelledOrderIds },
              OR: [{ targetType: 'ORDER' }, { targetType: 'Order' }],
            },
            orderBy: { createdAt: 'desc' },
            select: {
              targetId: true,
              newData: true,
            },
          })
        : Promise.resolve([]),
      deliveredOrderIds.length > 0
        ? this.prisma.orderStatusHistory.findMany({
            where: {
              orderId: { in: deliveredOrderIds },
              newStatus: 'DELIVERED',
            },
            orderBy: { changedAt: 'desc' },
            select: {
              orderId: true,
              changedAt: true,
            },
          })
        : Promise.resolve([]),
    ]);

    const cancelledReasonByOrderId = new Map<string, string>();
    for (const log of adminCancelLogs) {
      if (!log.targetId || cancelledReasonByOrderId.has(log.targetId)) {
        continue;
      }
      const reason = extractReasonFromAuditNewData(log.newData);
      if (!reason) {
        continue;
      }
      cancelledReasonByOrderId.set(log.targetId, reason);
    }

    const receivedAtByOrderId = new Map<string, Date>();
    for (const row of receivedHistory) {
      if (!receivedAtByOrderId.has(row.orderId)) {
        receivedAtByOrderId.set(row.orderId, row.changedAt);
      }
    }

    const items = orders.map((o) => {
      const latestRefund = o.refundTransactions[0];
      const shouldShowRefund =
        Boolean(latestRefund) &&
        ((latestRefund?.type === 'CANCEL_REFUND' && Boolean(o.cancelRequest)) ||
          latestRefund?.type === 'RETURN_REFUND');

      return {
        canceledReason:
          o.status === 'CANCELLED'
            ? o.cancelRequest?.reasonText?.trim() ||
              mapCancelReasonCodeToText(o.cancelRequest?.reasonCode) ||
              cancelledReasonByOrderId.get(o.id) ||
              null
            : null,
        cancelRequest: o.cancelRequest
          ? {
              id: o.cancelRequest.id,
              status: o.cancelRequest.status,
              reasonCode: o.cancelRequest.reasonCode,
              reasonText: o.cancelRequest.reasonText,
              bankAccountName: o.cancelRequest.bankAccountName,
              bankAccountNumber: o.cancelRequest.bankAccountNumber,
              bankName: o.cancelRequest.bankName,
              approvedAt: o.cancelRequest.approvedAt,
              completedAt: o.cancelRequest.completedAt,
            }
          : null,
        refund:
          shouldShowRefund && latestRefund
            ? {
                id: latestRefund.id,
                type: latestRefund.type,
                status: latestRefund.status,
                amount: Number(latestRefund.amount),
                requestedAt: latestRefund.requestedAt,
                processedAt: latestRefund.processedAt,
                failureReason: latestRefund.failureReason,
              }
            : null,
        id: o.id,
        createdAt: o.createdAt,
        receivedAt: receivedAtByOrderId.get(o.id) ?? null,
        status: o.status,
        returnStatus: o.returnStatus ?? null,
        totalPrice: Number(o.totalPrice),
        orderCode: o.paymentTransaction?.orderCode ?? null,
        payment: {
          method: o.payment?.method ?? null,
          status: o.payment?.status ?? null,
          paidAt: o.payment?.paidAt ?? null,
          transactionStatus: o.paymentTransaction?.status ?? null,
          transactionPaidAt: o.paymentTransaction?.paidAt ?? null,
        },
        items: o.items.map((it) => {
          const imageUrl = pickPrimaryImageUrl({
            variantImages: it.variant?.images,
            productImages: it.product.images,
          });
          return {
            id: it.id,
            productId: it.productId,
            variantId: it.variantId,
            name: it.product.name,
            imageUrl,
            attributesText: safeAttributesToText(it.variant?.attributes),
            quantity: it.quantity,
            price: Number(it.price),
          };
        }),
      } satisfies MyOrderDto;
    });

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getMyCounts(userId: string): Promise<MyOrderCountsResult> {
    if (!userId) {
      throw new BadRequestError('User ID not found');
    }

    const rows = await this.prisma.order.groupBy({
      by: ['status'],
      where: { userId },
      _count: { _all: true },
    });

    const counts = rows.reduce(
      (acc, r) => {
        acc[r.status] = r._count._all;
        return acc;
      },
      {} as Record<string, number>,
    );

    const pending = counts.PENDING ?? 0;
    const processing = (counts.CONFIRMED ?? 0) + (counts.PAID ?? 0);
    const shipped = counts.SHIPPED ?? 0;
    const completed = counts.DELIVERED ?? 0;
    const canceled = counts.CANCELLED ?? 0;
    const all = Object.values(counts).reduce((sum, n) => sum + n, 0);

    return { all, pending, processing, shipped, completed, canceled };
  }

  async getMyOrderDetail(input: { userId: string; orderId: string }): Promise<MyOrderDto> {
    const userId = input.userId;
    const orderId = input.orderId;

    if (!userId) {
      throw new BadRequestError('User ID not found');
    }
    if (!orderId) {
      throw new BadRequestError('orderId is required');
    }

    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      select: {
        id: true,
        createdAt: true,
        status: true,
        returnStatus: true,
        totalPrice: true,
        payment: { select: { method: true, status: true, paidAt: true } },
        paymentTransaction: { select: { status: true, orderCode: true, paidAt: true } },
        cancelRequest: {
          select: {
            id: true,
            status: true,
            reasonCode: true,
            reasonText: true,
            bankAccountName: true,
            bankAccountNumber: true,
            bankName: true,
            approvedAt: true,
            completedAt: true,
          },
        },
        refundTransactions: {
          select: {
            id: true,
            type: true,
            status: true,
            amount: true,
            requestedAt: true,
            processedAt: true,
            failureReason: true,
          },
          orderBy: { requestedAt: 'desc' },
          take: 1,
        },
        items: {
          select: {
            id: true,
            productId: true,
            variantId: true,
            quantity: true,
            price: true,
            product: {
              select: {
                id: true,
                name: true,
                images: { select: { url: true, isPrimary: true, sortOrder: true } },
              },
            },
            variant: {
              select: {
                id: true,
                attributes: true,
                images: { select: { url: true, isPrimary: true, sortOrder: true } },
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new BadRequestError('Order not found');
    }

    const adminCancelLog =
      order.status === 'CANCELLED'
        ? await this.prisma.auditLog.findFirst({
            where: {
              action: 'ADMIN_CANCEL_ORDER',
              targetId: order.id,
              OR: [{ targetType: 'ORDER' }, { targetType: 'Order' }],
            },
            orderBy: { createdAt: 'desc' },
            select: { newData: true },
          })
        : null;

    const cancelledReasonFromAudit = extractReasonFromAuditNewData(adminCancelLog?.newData ?? null);

    const latestRefund = order.refundTransactions[0];
    const receivedHistory = await this.prisma.orderStatusHistory.findFirst({
      where: { orderId: order.id, newStatus: 'DELIVERED' },
      orderBy: { changedAt: 'desc' },
      select: { changedAt: true },
    });
    const shouldShowRefund =
      Boolean(latestRefund) &&
      ((latestRefund?.type === 'CANCEL_REFUND' && Boolean(order.cancelRequest)) ||
        latestRefund?.type === 'RETURN_REFUND');

    return {
      canceledReason:
        order.status === 'CANCELLED'
          ? order.cancelRequest?.reasonText?.trim() ||
            mapCancelReasonCodeToText(order.cancelRequest?.reasonCode) ||
            cancelledReasonFromAudit ||
            null
          : null,
      cancelRequest: order.cancelRequest
        ? {
            id: order.cancelRequest.id,
            status: order.cancelRequest.status,
            reasonCode: order.cancelRequest.reasonCode,
            reasonText: order.cancelRequest.reasonText,
            bankAccountName: order.cancelRequest.bankAccountName,
            bankAccountNumber: order.cancelRequest.bankAccountNumber,
            bankName: order.cancelRequest.bankName,
            approvedAt: order.cancelRequest.approvedAt,
            completedAt: order.cancelRequest.completedAt,
          }
        : null,
      refund:
        shouldShowRefund && latestRefund
          ? {
              id: latestRefund.id,
              type: latestRefund.type,
              status: latestRefund.status,
              amount: Number(latestRefund.amount),
              requestedAt: latestRefund.requestedAt,
              processedAt: latestRefund.processedAt,
              failureReason: latestRefund.failureReason,
            }
          : null,
      id: order.id,
      createdAt: order.createdAt,
      receivedAt: receivedHistory?.changedAt ?? null,
      status: order.status,
      returnStatus: order.returnStatus ?? null,
      totalPrice: Number(order.totalPrice),
      orderCode: order.paymentTransaction?.orderCode ?? null,
      payment: {
        method: order.payment?.method ?? null,
        status: order.payment?.status ?? null,
        paidAt: order.payment?.paidAt ?? null,
        transactionStatus: order.paymentTransaction?.status ?? null,
        transactionPaidAt: order.paymentTransaction?.paidAt ?? null,
      },
      items: order.items.map((it) => {
        const imageUrl = pickPrimaryImageUrl({
          variantImages: it.variant?.images,
          productImages: it.product.images,
        });
        return {
          id: it.id,
          productId: it.productId,
          variantId: it.variantId,
          name: it.product.name,
          imageUrl,
          attributesText: safeAttributesToText(it.variant?.attributes),
          quantity: it.quantity,
          price: Number(it.price),
        };
      }),
    } satisfies MyOrderDto;
  }

  async cancelMyOrder(input: { userId: string; orderId: string }): Promise<CancelMyOrderResult> {
    const userId = input.userId;
    const orderId = input.orderId;

    if (!userId) {
      throw new BadRequestError('User ID not found');
    }
    if (!orderId) {
      throw new BadRequestError('orderId is required');
    }

    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      select: {
        id: true,
        status: true,
        totalPrice: true,
        payment: { select: { status: true } },
        paymentTransaction: { select: { status: true } },
      },
    });

    if (!order) {
      throw new BadRequestError('Order not found');
    }

    if (order.status === 'CANCELLED') {
      // Keep things consistent for already-cancelled orders.
      // If an online payment transaction exists and is still PENDING, mark it FAILED
      // so the UI doesn't show "Đang chờ thanh toán" for a cancelled order.
      await this.prisma.$transaction(async (tx) => {
        await tx.paymentTransaction.updateMany({
          where: { orderId: order.id, status: 'PENDING' },
          data: {
            status: 'FAILED',
            gatewayCode: 'ORDER_CANCELLED',
            gatewayStatus: 'CANCELLED',
          },
        });

        await tx.payment.updateMany({
          where: { orderId: order.id, status: 'PENDING' },
          data: { status: 'FAILED' },
        });
      });

      return { id: order.id, status: order.status };
    }

    if (order.status === 'PAID') {
      throw new BadRequestError(
        'Paid orders must use cancel-request flow and wait for admin approval',
      );
    }

    if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
      throw new BadRequestError('Only pending or processing orders can be cancelled');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' },
        select: { id: true, status: true },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          oldStatus: order.status,
          newStatus: 'CANCELLED',
          changedBy: userId,
        },
      });

      await tx.paymentTransaction.updateMany({
        where: { orderId, status: 'PENDING' },
        data: {
          status: 'FAILED',
          gatewayCode: 'ORDER_CANCELLED',
          gatewayStatus: 'CANCELLED',
        },
      });

      await tx.payment.updateMany({
        where: { orderId, status: 'PENDING' },
        data: { status: 'FAILED' },
      });

      if (order.payment?.status === 'PAID' || order.payment?.status === 'SUCCESS') {
        await tx.refundTransaction.upsert({
          where: {
            orderId_type: {
              orderId,
              type: 'CANCEL_REFUND',
            },
          },
          create: {
            orderId,
            type: 'CANCEL_REFUND',
            amount: order.totalPrice,
            status: 'PENDING',
            initiatedBy: 'USER',
            reason: 'Buyer requested order cancellation',
            idempotencyKey: `cancel-${orderId}`,
          },
          update: {
            reason: 'Buyer requested order cancellation',
          },
        });
      }

      await tx.auditLog.create({
        data: {
          actorType: 'USER',
          actorId: userId,
          targetType: 'Order',
          targetId: orderId,
          action: 'USER_ORDER_CANCELLED',
          oldData: { status: order.status } as Prisma.InputJsonValue,
          newData: { status: 'CANCELLED' } as Prisma.InputJsonValue,
        },
      });

      return updatedOrder;
    });

    return updated;
  }

  async requestPaidCancel(input: {
    userId: string;
    orderId: string;
    reasonCode: CancelReason;
    reasonText: string | null;
    bankAccountName: string;
    bankAccountNumber: string;
    bankName: string;
  }): Promise<RequestPaidCancelResult> {
    const userId = input.userId;
    const orderId = input.orderId;

    if (!userId) {
      throw new BadRequestError('User ID not found');
    }
    if (!orderId) {
      throw new BadRequestError('orderId is required');
    }

    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      select: {
        id: true,
        status: true,
        totalPrice: true,
        payment: { select: { status: true } },
        paymentTransaction: { select: { status: true, orderCode: true } },
        cancelRequest: { select: { status: true } },
      },
    });

    if (!order) {
      throw new BadRequestError('Order not found');
    }

    const isPaymentPaid = order.payment?.status === 'PAID' || order.payment?.status === 'SUCCESS';
    if (!['PAID', 'CONFIRMED'].includes(order.status) || !isPaymentPaid) {
      throw new BadRequestError('Only paid processing orders can request cancellation approval');
    }

    const shouldNotifyAdmins = order.cancelRequest?.status !== 'REQUESTED';
    const admins = shouldNotifyAdmins
      ? await this.prisma.userRole.findMany({
          where: {
            role: {
              code: 'ADMIN',
            },
          },
          select: {
            userId: true,
          },
          distinct: ['userId'],
        })
      : [];
    const adminNotificationContent = buildAdminCancelRequestContent({
      orderId,
      orderCode: order.paymentTransaction?.orderCode ?? null,
      reasonCode: input.reasonCode,
      reasonText: input.reasonText,
    });

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.orderCancelRequest.upsert({
        where: { orderId },
        create: {
          orderId,
          reasonCode: input.reasonCode,
          reasonText: input.reasonText,
          status: 'REQUESTED',
          requestedByUserId: userId,
          bankAccountName: input.bankAccountName,
          bankAccountNumber: input.bankAccountNumber,
          bankName: input.bankName,
        },
        update: {
          reasonCode: input.reasonCode,
          reasonText: input.reasonText,
          status: 'REQUESTED',
          requestedByUserId: userId,
          approvedAt: null,
          approvedByAdminId: null,
          rejectedAt: null,
          rejectedByAdminId: null,
          rejectionReason: null,
          completedAt: null,
          bankAccountName: input.bankAccountName,
          bankAccountNumber: input.bankAccountNumber,
          bankName: input.bankName,
        },
      });

      await tx.refundTransaction.upsert({
        where: {
          orderId_type: {
            orderId,
            type: 'CANCEL_REFUND',
          },
        },
        create: {
          orderId,
          type: 'CANCEL_REFUND',
          amount: order.totalPrice,
          status: 'PENDING',
          initiatedBy: 'USER',
          reason: `Cancellation request: ${String(input.reasonCode)}${input.reasonText ? ` - ${input.reasonText}` : ''}`,
          idempotencyKey: `cancel-${orderId}`,
        },
        update: {
          status: 'PENDING',
          failureReason: null,
          reason: `Cancellation request: ${String(input.reasonCode)}${input.reasonText ? ` - ${input.reasonText}` : ''}`,
        },
      });

      if (admins.length > 0) {
        const createdRows = await Promise.all(
          admins.map((admin) =>
            tx.notification.create({
              data: {
                userId: admin.userId,
                content: adminNotificationContent,
                isRead: false,
              },
              select: {
                id: true,
                content: true,
                isRead: true,
                createdAt: true,
                userId: true,
              },
            }),
          ),
        );

        await tx.auditLog.create({
          data: {
            actorType: 'SYSTEM',
            targetType: 'Order',
            targetId: orderId,
            action: 'ADMIN_CANCEL_REQUEST_NOTIFICATION_SENT',
            newData: {
              orderCode: order.paymentTransaction?.orderCode ?? null,
              reasonCode: input.reasonCode,
              reasonText: input.reasonText,
              receivers: createdRows.length,
            } as Prisma.InputJsonValue,
          },
        });

        for (const row of createdRows) {
          adminNotificationHub.sendCancelRequest(row.userId, {
            id: row.id,
            content: row.content,
            isRead: row.isRead,
            createdAt: row.createdAt.toISOString(),
          });
        }

        logger.info('Admin cancel-request notifications sent', {
          orderId,
          orderCode: order.paymentTransaction?.orderCode ?? null,
          receivers: createdRows.length,
        });
      }

      await tx.auditLog.create({
        data: {
          actorType: 'USER',
          actorId: userId,
          targetType: 'Order',
          targetId: orderId,
          action: 'USER_ORDER_CANCEL_REQUESTED',
          newData: {
            reasonCode: input.reasonCode,
            reasonText: input.reasonText ?? null,
            bankAccountName: input.bankAccountName,
            bankAccountNumber: input.bankAccountNumber,
            bankName: input.bankName,
          } as Prisma.InputJsonValue,
        },
      });

      return tx.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          status: true,
          cancelRequest: {
            select: {
              status: true,
            },
          },
        },
      });
    });

    return {
      id: updated?.id ?? orderId,
      status: updated?.status ?? order.status,
      cancelRequestStatus: updated?.cancelRequest?.status ?? 'REQUESTED',
    };
  }

  async confirmReceived(input: {
    userId: string;
    orderId: string;
  }): Promise<ConfirmReceivedResult> {
    const userId = input.userId;
    const orderId = input.orderId;

    if (!userId) {
      throw new BadRequestError('User ID not found');
    }
    if (!orderId) {
      throw new BadRequestError('orderId is required');
    }

    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      select: {
        id: true,
        status: true,
        paymentTransaction: { select: { orderCode: true } },
      },
    });

    if (!order) {
      throw new BadRequestError('Order not found');
    }

    if (order.status === 'DELIVERED') {
      return { id: order.id, status: order.status };
    }

    if (order.status !== 'SHIPPED') {
      throw new BadRequestError('Only shipped orders can be confirmed as received');
    }

    const receivedNotificationContent = buildOrderReceivedNotificationContent({
      orderId,
      orderCode: order.paymentTransaction?.orderCode ?? null,
    });

    const updated = await this.prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: 'DELIVERED' },
        select: { id: true, status: true },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          oldStatus: order.status,
          newStatus: 'DELIVERED',
          changedBy: userId,
        },
      });

      await tx.auditLog.create({
        data: {
          actorType: 'USER',
          actorId: userId,
          targetType: 'Order',
          targetId: orderId,
          action: 'USER_ORDER_RECEIVED_CONFIRMED',
          oldData: { status: order.status } as Prisma.InputJsonValue,
          newData: { status: 'DELIVERED' } as Prisma.InputJsonValue,
        },
      });

      await tx.notification.create({
        data: {
          userId,
          content: receivedNotificationContent,
          isRead: false,
        },
      });

      await tx.auditLog.create({
        data: {
          actorType: 'SYSTEM',
          targetType: 'Order',
          targetId: orderId,
          action: 'USER_ORDER_RECEIVED_NOTIFICATION_SENT',
          newData: {
            orderCode: order.paymentTransaction?.orderCode ?? null,
          } as Prisma.InputJsonValue,
        },
      });

      return updatedOrder;
    });

    return updated;
  }
}
