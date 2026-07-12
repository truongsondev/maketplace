import express, { Request, Response } from 'express';
import type { Prisma, PrismaClient } from '@/generated/prisma/client';
import type { OrderStatus } from '@/generated/prisma/enums';
import { asyncHandler } from '../../../../../shared/server/error-middleware';
import { ResponseFormatter } from '../../../../../shared/server/api-response';
import { HttpErrorHandler } from '../../../../../shared/server/http-error-handler';
import { BadRequestError } from '../../../../../error-handlling/badRequestError';
import { ForbiddenError } from '../../../../../error-handlling/forbiddenError';
import type { AdminOrderReturnsController } from '../../interface-adapter/controller/admin-order-returns.controller';
import type { AdminOrderAnalyticsController } from '../../interface-adapter/controller/admin-order-analytics.controller';
import type { CodSettlementService } from '../../../../payment/applications/services/cod-settlement.service';
import { awardLoyaltyForOrder, LoyaltyMutationService } from '../../../../user-profile/loyalty.service';

type AdminOrderTab =
  | 'all'
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'waiting-return'
  | 'return-in-transit'
  | 'return-received'
  | 'return-lost'
  | 'return-damaged'
  | 'completed'
  | 'canceled';
type OrderSort = 'new' | 'old';
type AdminOrderRequestType = 'all' | 'cancel' | 'return' | 'refund';
type AdminOrderRequestStatus =
  | 'all'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'completed'
  | 'failed';

function parsePositiveInt(value: unknown, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.floor(n);
}

type ParsedDateInput = { date: Date; isDateOnly: boolean };

function startOfDay(d: Date): Date {
  const next = new Date(d);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(d: Date, days: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + days);
  return next;
}

function parseDateInput(value: unknown, fieldName: string): ParsedDateInput | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string') {
    throw new BadRequestError(`${fieldName} must be a date string`);
  }

  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const dateValue = isDateOnly ? `${value}T00:00:00` : value;
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestError(`${fieldName} is not a valid date`);
  }

  return { date: parsed, isDateOnly };
}

function parseDateRangeFilter(query: Request['query']): { from?: Date; to?: Date } {
  const fromInput = parseDateInput(query.from, 'from');
  const toInput = parseDateInput(query.to, 'to');

  if (!fromInput && !toInput) {
    return {};
  }

  const from = fromInput
    ? fromInput.isDateOnly
      ? startOfDay(fromInput.date)
      : fromInput.date
    : undefined;
  let to = toInput ? (toInput.isDateOnly ? startOfDay(toInput.date) : toInput.date) : undefined;
  if (toInput?.isDateOnly && to) {
    to = addDays(to, 1);
  }

  if (from && to && from >= to) {
    throw new BadRequestError('from must be before to');
  }

  return { from, to };
}

function parseAnalyticsRange(query: Request['query']): { from?: Date; to?: Date; days?: number } {
  const range = parseDateRangeFilter(query);
  if (range.from || range.to) {
    if (!range.from || !range.to) {
      throw new BadRequestError('from and to are required when filtering by date range');
    }
    return range;
  }

  const days = parsePositiveInt(query.days, 30);
  if (days > 365) {
    throw new BadRequestError('days must be <= 365');
  }
  return { days };
}

function mapTabToStatuses(tab: AdminOrderTab | undefined): OrderStatus[] | undefined {
  if (!tab || tab === 'all') return undefined;
  if (tab === 'pending') return ['PENDING'];
  if (tab === 'processing') return ['CONFIRMED', 'PAID'];
  if (tab === 'shipped') return ['AWAITING_PICKUP', 'SHIPPED', 'DELIVERING'];
  if (tab === 'completed') return ['DELIVERED'];
  if (tab === 'canceled') return ['CANCELLED'];
  return undefined;
}

function buildTabWhere(tab: AdminOrderTab | undefined): Prisma.OrderWhereInput | undefined {
  if (tab === 'waiting-return') {
    return {
      returnStatus: { in: ['APPROVED', 'PICKING'] },
      items: { some: { returns: { some: { status: 'RT_APPROVED', requestType: 'RETURN_REFUND' } } } },
    };
  }
  if (tab === 'return-received') {
    return {
      returnStatus: 'SHIPPING',
      returnShipment: { is: { providerStatus: { in: ['delivered', 'DELIVERED'] } } },
    };
  }
  if (tab === 'return-in-transit') {
    return {
      returnStatus: 'SHIPPING',
      returnShipment: {
        is: {
          providerStatus: {
            in: [
              'picked',
              'storing',
              'transporting',
              'sorting',
              'delivering',
              'money_collect_delivering',
            ],
          },
        },
      },
    };
  }
  if (tab === 'return-lost') {
    return {
      returnShipment: { is: { providerStatus: { in: ['lost', 'LOST'] } } },
    };
  }
  if (tab === 'return-damaged') {
    return {
      returnShipment: { is: { providerStatus: { in: ['damage', 'DAMAGE'] } } },
    };
  }
  const statuses = mapTabToStatuses(tab);
  return statuses ? { status: { in: statuses } } : undefined;
}

function parseRequestType(value: unknown): AdminOrderRequestType {
  if (
    value === 'cancel' ||
    value === 'return' ||
    value === 'refund' ||
    value === 'all' ||
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return (value || 'all') as AdminOrderRequestType;
  }
  throw new BadRequestError('requestType is invalid');
}

function parseRequestStatus(value: unknown): AdminOrderRequestStatus {
  if (
    value === 'pending' ||
    value === 'approved' ||
    value === 'rejected' ||
    value === 'completed' ||
    value === 'failed' ||
    value === 'all' ||
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return (value || 'all') as AdminOrderRequestStatus;
  }
  throw new BadRequestError('requestStatus is invalid');
}

function buildRequestTypeWhere(type: AdminOrderRequestType): Prisma.OrderWhereInput | undefined {
  if (type === 'all') return undefined;
  if (type === 'cancel') return { cancelRequest: { isNot: null } };
  if (type === 'return') {
    return {
      OR: [
        { returnStatus: { not: null } },
        { items: { some: { returns: { some: {} } } } },
      ],
    };
  }
  return {
    refundTransactions: {
      some: { type: { in: ['CANCEL_REFUND', 'RETURN_REFUND'] } },
    },
  };
}

function buildRequestStatusWhere(
  status: AdminOrderRequestStatus,
): Prisma.OrderWhereInput | undefined {
  if (status === 'all') return undefined;
  if (status === 'pending') {
    return {
      OR: [
        { cancelRequest: { is: { status: 'REQUESTED' } } },
        { returnStatus: 'REQUESTED' },
        { refundTransactions: { some: { status: { in: ['PENDING', 'RETRYING'] } } } },
      ],
    };
  }
  if (status === 'approved') {
    return {
      OR: [
        { cancelRequest: { is: { status: 'APPROVED' } } },
        { returnStatus: { in: ['APPROVED', 'PICKING', 'SHIPPING'] } },
      ],
    };
  }
  if (status === 'rejected') {
    return {
      OR: [
        { cancelRequest: { is: { status: 'REJECTED' } } },
        { returnStatus: 'REJECTED' },
      ],
    };
  }
  if (status === 'completed') {
    return {
      OR: [
        { cancelRequest: { is: { status: 'COMPLETED' } } },
        { returnStatus: 'COMPLETED' },
        { refundTransactions: { some: { status: 'SUCCESS' } } },
      ],
    };
  }
  return {
    refundTransactions: {
      some: { status: 'FAILED' },
    },
  };
}

function buildRequestFilterWhere(input: {
  requestType: AdminOrderRequestType;
  requestStatus: AdminOrderRequestStatus;
}): Prisma.OrderWhereInput[] {
  return [buildRequestTypeWhere(input.requestType), buildRequestStatusWhere(input.requestStatus)].filter(
    (where): where is Prisma.OrderWhereInput => Boolean(where),
  );
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

function escapeCsvValue(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function buildOrderCancelledNotificationContent(input: {
  orderId: string;
  orderCode: string | null;
  reason: string | null;
}): string {
  const label = input.orderCode?.trim() || input.orderId;
  const reasonSuffix = input.reason?.trim() ? ` Lý do: ${input.reason.trim()}.` : '';
  return `[ORDER_CANCELLED|${input.orderId}] Đơn hàng #${label} đã bị hủy.${reasonSuffix}`;
}

function mapCancelReasonCodeToText(code: string | null | undefined): string | null {
  if (!code) return null;
  if (code === 'NO_LONGER_NEEDED') return 'Không còn nhu cầu mua';
  if (code === 'BUY_OTHER_ITEM') return 'Mua sản phẩm khác';
  if (code === 'FOUND_CHEAPER') return 'Tìm được nơi bán rẻ hơn';
  if (code === 'OTHER') return 'Lý do khác';
  return null;
}

export class AdminOrdersAPI {
  readonly router = express.Router();

  constructor(
    private readonly prisma: PrismaClient,
    private readonly returnsController: AdminOrderReturnsController,
    private readonly analyticsController: AdminOrderAnalyticsController,
    private readonly codSettlementService: CodSettlementService,
  ) {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get('/', asyncHandler(this.listOrders.bind(this)));
    this.router.get('/export', asyncHandler(this.exportOrders.bind(this)));
    this.router.get('/counts', asyncHandler(this.getCounts.bind(this)));
    this.router.get('/analytics/status', asyncHandler(this.getAnalyticsStatus.bind(this)));
    this.router.get('/analytics/timeseries', asyncHandler(this.getAnalyticsTimeseries.bind(this)));
    this.router.post('/:orderId/cancel', asyncHandler(this.cancelOrder.bind(this)));
    this.router.post(
      '/:orderId/cancel-requests/approve',
      asyncHandler(this.approveCancelRequest.bind(this)),
    );
    this.router.post(
      '/:orderId/cancel-requests/reject',
      asyncHandler(this.rejectCancelRequest.bind(this)),
    );
    this.router.post(
      '/:orderId/cancel-requests/complete-refund',
      asyncHandler(this.completeCancelRefund.bind(this)),
    );
    this.router.get('/:orderId/confirm/check', asyncHandler(this.checkConfirmOrder.bind(this)));
    this.router.post('/:orderId/confirm', asyncHandler(this.confirmOrder.bind(this)));
    this.router.post('/:orderId/pack', asyncHandler(this.packOrder.bind(this)));
    this.router.post('/:orderId/ship', asyncHandler(this.shipOrder.bind(this)));
    this.router.post('/:orderId/deliver', asyncHandler(this.deliverOrder.bind(this)));
    this.router.post('/:orderId/delivery-failed', asyncHandler(this.deliveryFailed.bind(this)));
    this.router.post('/:orderId/return-to-store', asyncHandler(this.returnToStore.bind(this)));
    this.router.post('/:orderId/complete', asyncHandler(this.completeOrder.bind(this)));
    this.router.post('/:orderId/returns/approve', asyncHandler(this.approveReturns.bind(this)));
    this.router.post('/:orderId/returns/reject', asyncHandler(this.rejectReturns.bind(this)));
    this.router.post('/:orderId/returns/pickup', asyncHandler(this.pickupReturns.bind(this)));
    this.router.post('/:orderId/returns/complete', asyncHandler(this.completeReturns.bind(this)));
  }

  private async getAnalyticsStatus(req: Request, res: Response): Promise<void> {
    const range = parseAnalyticsRange(req.query);
    const result = await this.analyticsController.getStatusBreakdown(range);
    res.status(200).json(ResponseFormatter.success(result, 'OK'));
  }

  private async getAnalyticsTimeseries(req: Request, res: Response): Promise<void> {
    const range = parseAnalyticsRange(req.query);
    const result = await this.analyticsController.getTimeseries(range);
    res.status(200).json(ResponseFormatter.success(result, 'OK'));
  }

  private async transitionStatus(params: {
    orderId: string;
    actorId: string;
    to: OrderStatus;
    allowedFrom: OrderStatus[];
    okIfAlreadyIn?: OrderStatus[];
    orderData?: Prisma.OrderUpdateInput;
    reason?: string;
  }): Promise<{ id: string; status: OrderStatus }> {
    const { orderId, actorId, to, allowedFrom, okIfAlreadyIn, orderData, reason } = params;

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        userId: true,
        paymentTransaction: {
          select: {
            orderCode: true,
          },
        },
      },
    });

    if (!order) {
      throw new BadRequestError('Order not found');
    }

    if (order.status === to || okIfAlreadyIn?.includes(order.status)) {
      return { id: order.id, status: order.status };
    }

    if (!allowedFrom.includes(order.status)) {
      throw new BadRequestError(`Invalid status transition from ${order.status} to ${to}`);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { ...orderData, status: to },
        select: { id: true, status: true },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          oldStatus: order.status,
          newStatus: to,
          changedBy: actorId,
          reason: reason?.slice(0, 500) || null,
        },
      });

      await tx.auditLog.create({
        data: {
          actorType: 'ADMIN',
          actorId,
          targetType: 'Order',
          targetId: orderId,
          action: 'ADMIN_ORDER_STATUS_CHANGED',
          oldData: { status: order.status } as Prisma.InputJsonValue,
          newData: { status: to, reason: reason ?? null } as Prisma.InputJsonValue,
        },
      });

      if (to === 'DELIVERED' || to === 'COMPLETED') {
        await awardLoyaltyForOrder(tx, orderId);
      }

      return updatedOrder;
    });

    return updated;
  }

  private async evaluateOrderConfirmationReadiness(params: {
    orderId: string;
    requirePaidStatus: boolean;
  }): Promise<{
    orderId: string;
    currentStatus: OrderStatus;
    canConfirm: boolean;
    issues: string[];
    blockingItems: Array<{
      orderItemId: string;
      productId: string;
      productName: string;
      variantId: string | null;
      reasons: string[];
    }>;
  }> {
    const { orderId, requirePaidStatus } = params;

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        payment: { select: { method: true, status: true } },
        items: {
          select: {
            id: true,
            productId: true,
            variantId: true,
            product: {
              select: {
                id: true,
                name: true,
                status: true,
                isDeleted: true,
                deletedAt: true,
              },
            },
            variant: {
              select: {
                id: true,
                status: true,
                isDeleted: true,
                deletedAt: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new BadRequestError('Order not found');
    }

    const issues: string[] = [];
    const blockingItems: Array<{
      orderItemId: string;
      productId: string;
      productName: string;
      variantId: string | null;
      reasons: string[];
    }> = [];

    const isPendingCod =
      order.status === 'PENDING' &&
      order.payment?.method === 'COD' &&
      order.payment.status === 'PENDING';
    if (requirePaidStatus && order.status !== 'PAID' && !isPendingCod) {
      issues.push('Đơn PayOS phải PAID; đơn COD phải đang chờ xác nhận.');
    }
    if (!requirePaidStatus && order.status === 'PENDING' && !isPendingCod) {
      issues.push('Không thể xác nhận đơn online chưa thanh toán.');
    }

    if (order.items.length === 0) {
      issues.push('Đơn hàng không có sản phẩm hợp lệ để xác nhận.');
    }

    for (const item of order.items) {
      const reasons: string[] = [];

      const product = item.product;
      const variant = item.variant;

      if (product.isDeleted || product.deletedAt !== null) {
        reasons.push('Sản phẩm đã bị xóa.');
      }

      if (product.status !== 'ACTIVE') {
        reasons.push(`Sản phẩm không ở trạng thái ACTIVE (hiện tại: ${product.status}).`);
      }

      if (item.variantId && !variant) {
        reasons.push('Biến thể đã bị xóa hoặc không còn tồn tại.');
      }

      if (variant) {
        if (variant.isDeleted || variant.deletedAt !== null) {
          reasons.push('Biến thể đã bị xóa.');
        }

        if (variant.status !== 'ACTIVE') {
          reasons.push(`Biến thể không ở trạng thái ACTIVE (hiện tại: ${variant.status}).`);
        }
      }

      if (reasons.length > 0) {
        blockingItems.push({
          orderItemId: item.id,
          productId: item.productId,
          productName: product.name,
          variantId: item.variantId,
          reasons,
        });
      }
    }

    if (blockingItems.length > 0) {
      issues.push('Có sản phẩm/biến thể trong đơn không còn hợp lệ để xác nhận.');
    }

    return {
      orderId: order.id,
      currentStatus: order.status,
      canConfirm: issues.length === 0,
      issues,
      blockingItems,
    };
  }

  private async checkConfirmOrder(req: Request, res: Response): Promise<void> {
    const rawOrderId = (req.params as any).orderId as string | string[] | undefined;
    const orderId = Array.isArray(rawOrderId) ? rawOrderId[0] : rawOrderId;
    HttpErrorHandler.validateRequired({ orderId }, 'orderId');
    if (!orderId) {
      throw new BadRequestError('orderId is required');
    }

    const readiness = await this.evaluateOrderConfirmationReadiness({
      orderId,
      requirePaidStatus: true,
    });

    res
      .status(200)
      .json(
        ResponseFormatter.success(
          readiness,
          readiness.canConfirm ? 'Order can be confirmed' : 'Order cannot be confirmed',
        ),
      );
  }

  private async confirmOrder(req: Request, res: Response): Promise<void> {
    const rawOrderId = (req.params as any).orderId as string | string[] | undefined;
    const orderId = Array.isArray(rawOrderId) ? rawOrderId[0] : rawOrderId;
    HttpErrorHandler.validateRequired({ orderId }, 'orderId');
    if (!orderId) {
      throw new BadRequestError('orderId is required');
    }

    const actorId = (req as any).userId as string | undefined;
    if (!actorId) {
      throw new ForbiddenError('Authentication required');
    }

    const readiness = await this.evaluateOrderConfirmationReadiness({
      orderId,
      requirePaidStatus: false,
    });

    if (!readiness.canConfirm) {
      throw new BadRequestError(`Order cannot be confirmed. ${readiness.issues.join(' ')}`);
    }

    const updated = await this.transitionStatus({
      orderId,
      actorId,
      to: 'CONFIRMED',
      allowedFrom: ['PAID', 'PENDING'],
      okIfAlreadyIn: ['CONFIRMED', 'SHIPPED', 'DELIVERED', 'RETURNED'],
    });

    res.status(200).json(ResponseFormatter.success(updated, 'Order confirmed'));
  }

  private async packOrder(req: Request, res: Response): Promise<void> {
    const orderId = String(req.params.orderId || '');
    if (!req.userId) throw new ForbiddenError('Authentication required');
    const updated = await this.transitionStatus({ orderId, actorId: req.userId, to: 'PACKING', allowedFrom: ['CONFIRMED'], okIfAlreadyIn: ['PACKING', 'SHIPPED', 'DELIVERED', 'COMPLETED'] });
    res.status(200).json(ResponseFormatter.success(updated, 'Order packing'));
  }

  private async shipOrder(req: Request, res: Response): Promise<void> {
    const rawOrderId = (req.params as any).orderId as string | string[] | undefined;
    const orderId = Array.isArray(rawOrderId) ? rawOrderId[0] : rawOrderId;
    HttpErrorHandler.validateRequired({ orderId }, 'orderId');
    if (!orderId) {
      throw new BadRequestError('orderId is required');
    }

    const actorId = (req as any).userId as string | undefined;
    if (!actorId) {
      throw new ForbiddenError('Authentication required');
    }

    const body = (req.body ?? {}) as Record<string, unknown>;
    const carrierName = typeof body.carrierName === 'string' ? body.carrierName.trim() : '';
    const trackingCode = typeof body.trackingCode === 'string' ? body.trackingCode.trim() : '';
    const deliveryNote = typeof body.deliveryNote === 'string' ? body.deliveryNote.trim() : '';
    if (carrierName.length > 120 || trackingCode.length > 120 || deliveryNote.length > 500) {
      throw new BadRequestError('Shipping metadata exceeds allowed length');
    }

    const updated = await this.transitionStatus({
      orderId,
      actorId,
      to: 'SHIPPED',
      allowedFrom: ['PACKING'],
      okIfAlreadyIn: ['SHIPPED', 'DELIVERED', 'RETURNED'],
      orderData: {
        shippedAt: new Date(),
        carrierName: carrierName || null,
        trackingCode: trackingCode || null,
        deliveryNote: deliveryNote || null,
      },
    });

    res.status(200).json(ResponseFormatter.success(updated, 'Order shipped'));
  }

  private async deliverOrder(req: Request, res: Response): Promise<void> {
    const rawOrderId = (req.params as any).orderId as string | string[] | undefined;
    const orderId = Array.isArray(rawOrderId) ? rawOrderId[0] : rawOrderId;
    HttpErrorHandler.validateRequired({ orderId }, 'orderId');
    if (!orderId) {
      throw new BadRequestError('orderId is required');
    }

    const actorId = (req as any).userId as string | undefined;
    if (!actorId) {
      throw new ForbiddenError('Authentication required');
    }

    await this.codSettlementService.settleOnDelivery(orderId, actorId);

    const updated = await this.transitionStatus({
      orderId,
      actorId,
      to: 'DELIVERED',
      allowedFrom: ['DELIVERING'],
      okIfAlreadyIn: ['DELIVERED', 'RETURNED'],
      orderData: { deliveredAt: new Date() },
    });

    res.status(200).json(ResponseFormatter.success(updated, 'Order delivered'));
  }

  private async deliveryFailed(req: Request, res: Response): Promise<void> {
    const orderId = String(req.params.orderId || '');
    if (!req.userId) throw new ForbiddenError('Authentication required');
    const reason = String((req.body as Record<string, unknown>)?.reason || '').trim();
    if (!reason) throw new BadRequestError('Failure reason is required');
    const updated = await this.transitionStatus({ orderId, actorId: req.userId, to: 'DELIVERY_FAILED', allowedFrom: ['SHIPPED', 'DELIVERING'], okIfAlreadyIn: ['DELIVERY_FAILED', 'RETURN_TO_STORE'], reason });
    res.status(200).json(ResponseFormatter.success(updated, 'Delivery failure recorded'));
  }

  private async returnToStore(req: Request, res: Response): Promise<void> {
    const orderId = String(req.params.orderId || '');
    if (!req.userId) throw new ForbiddenError('Authentication required');
    const result = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId }, include: { payment: true, items: true } });
      if (!order) throw new BadRequestError('Order not found');
      if (order.status === 'RETURN_TO_STORE') return { id: order.id, status: order.status };
      if (order.status !== 'DELIVERY_FAILED') throw new BadRequestError('Only failed delivery can return to store');
      const claimed = await tx.order.updateMany({ where: { id: orderId, status: 'DELIVERY_FAILED' }, data: { status: 'RETURN_TO_STORE' } });
      if (claimed.count !== 1) throw new BadRequestError('Order status changed, please retry');
      if (order.payment?.method === 'COD' && order.payment.status === 'PENDING') {
        for (const item of order.items) {
          if (!item.variantId) continue;
          const released = await tx.productVariant.updateMany({ where: { id: item.variantId, stockReserved: { gte: item.quantity } }, data: { stockReserved: { decrement: item.quantity }, stockAvailable: { increment: item.quantity } } });
          if (released.count !== 1) throw new BadRequestError(`Reserved stock inconsistent for ${item.variantId}`);
          await tx.inventoryLog.create({ data: { variantId: item.variantId, action: 'RELEASE', quantity: item.quantity, referenceType: 'ORDER_RETURN_TO_STORE', referenceId: orderId, actorId: req.userId, reason: 'COD delivery failed; stock returned to store', salesChannel: 'ONLINE' } });
        }
      }
      await tx.orderStatusHistory.create({ data: { orderId, oldStatus: 'DELIVERY_FAILED', newStatus: 'RETURN_TO_STORE', changedBy: req.userId, reason: 'Goods received back at store' } });
      await tx.auditLog.create({ data: { actorType: 'ADMIN', actorId: req.userId, targetType: 'Order', targetId: orderId, action: 'ORDER_RETURNED_TO_STORE' } });
      return { id: order.id, status: 'RETURN_TO_STORE' as const };
    });
    res.status(200).json(ResponseFormatter.success(result, 'Goods returned to store'));
  }

  private async completeOrder(req: Request, res: Response): Promise<void> {
    const orderId = String(req.params.orderId || '');
    if (!req.userId) throw new ForbiddenError('Authentication required');
    const updated = await this.transitionStatus({ orderId, actorId: req.userId, to: 'COMPLETED', allowedFrom: ['DELIVERED'], okIfAlreadyIn: ['COMPLETED'] });
    res.status(200).json(ResponseFormatter.success(updated, 'Order completed'));
  }

  private async listOrders(req: Request, res: Response): Promise<void> {
    const tab = (req.query.tab as AdminOrderTab | undefined) ?? 'all';
    const search = (req.query.search as string | undefined)?.trim();
    const sort = (req.query.sort as OrderSort | undefined) ?? 'new';
    const requestType = parseRequestType(req.query.requestType);
    const requestStatus = parseRequestStatus(req.query.requestStatus);

    const page = parsePositiveInt(req.query.page, 1);
    const limit = Math.min(parsePositiveInt(req.query.limit, 10), 50);
    const skip = (page - 1) * limit;

    const range = parseDateRangeFilter(req.query);

    const tabWhere = buildTabWhere(tab);
    const requestFilters = buildRequestFilterWhere({ requestType, requestStatus });

    const where: Prisma.OrderWhereInput = {
      ...(requestFilters.length > 0 ? { AND: requestFilters } : {}),
      ...(tabWhere ?? {}),
      ...(range.from || range.to
        ? {
            createdAt: {
              ...(range.from ? { gte: range.from } : {}),
              ...(range.to ? { lt: range.to } : {}),
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              { id: { contains: search } },
              { user: { email: { contains: search } } },
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
        include: {
          user: {
            select: {
              id: true,
              email: true,
              phone: true,
            },
          },
          shippingAddress: {
            select: {
              sourceAddressId: true,
              recipientName: true,
              phone: true,
              addressLine: true,
              ward: true,
              district: true,
              city: true,
              snapshotSource: true,
            },
          },
          payment: { select: { method: true, status: true, paidAt: true } },
          shipment: { select: { providerStatus: true, externalFee: true, updatedAt: true } },
          returnShipment: {
            select: { providerOrderCode: true, providerStatus: true, externalFee: true, deliveredAt: true, updatedAt: true },
          },
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
              rejectionReason: true,
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
              failureReason: true,
              requestedAt: true,
              processedAt: true,
            },
            orderBy: { requestedAt: 'desc' },
          },
          items: {
            include: {
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
              returns: {
                select: {
                  id: true,
                  status: true,
                  requestType: true,
                  reason: true,
                  reasonCode: true,
                  evidenceImages: true,
                  bankAccountName: true,
                  bankAccountNumber: true,
                  bankName: true,
                  createdAt: true,
                },
              },
            },
          },
        },
      }),
    ]);

    const items = orders.map((o) => {
      const userLabel = o.user.email ?? o.user.phone ?? o.user.id;

      const returnsSummary = { requested: 0, approved: 0, shipping: 0, rejected: 0, completed: 0 };
      const returnDetails = o.items.flatMap((it) =>
        (it.returns ?? []).map((r) => ({
          id: r.id,
          orderItemId: it.id,
          status: r.status,
          requestType: r.requestType,
          reason: r.reason,
          reasonCode: r.reasonCode,
          evidenceImages: Array.isArray(r.evidenceImages) ? r.evidenceImages : [],
          bankAccountName: r.bankAccountName,
          bankAccountNumber: r.bankAccountNumber,
          bankName: r.bankName,
          createdAt: r.createdAt,
        })),
      );
      for (const it of o.items) {
        for (const r of it.returns ?? []) {
          if (r.status === 'RT_REQUESTED') returnsSummary.requested += 1;
          else if (r.status === 'RT_APPROVED') returnsSummary.approved += 1;
          else if (r.status === 'RT_SHIPPING') returnsSummary.shipping += 1;
          else if (r.status === 'RT_REJECTED') returnsSummary.rejected += 1;
          else if (r.status === 'RT_COMPLETED') returnsSummary.completed += 1;
        }
      }

      return {
        id: o.id,
        createdAt: o.createdAt,
        status: o.status,
        returnStatus: o.returnStatus ?? null,
        totalPrice: o.totalPrice,
        subtotalPrice: o.subtotalPrice,
        discountAmount: o.discountAmount ?? 0,
        shippingFee: o.shippingFee,
        delivery: {
          carrierName: o.carrierName,
          trackingCode: o.trackingCode,
          providerStatus: o.shipment?.providerStatus ?? null,
          deliveryNote: o.deliveryNote,
          shippedAt: o.shippedAt,
          deliveredAt: o.deliveredAt,
        },
        returnShipment: o.returnShipment
          ? {
              trackingCode: o.returnShipment.providerOrderCode,
              providerStatus: o.returnShipment.providerStatus,
              externalFee: o.returnShipment.externalFee,
              deliveredAt: o.returnShipment.deliveredAt,
              updatedAt: o.returnShipment.updatedAt,
            }
          : null,
        returns: {
          ...returnsSummary,
          details: returnDetails,
        },
        cancelRequest: o.cancelRequest
          ? {
              id: o.cancelRequest.id,
              status: o.cancelRequest.status,
              reasonCode: o.cancelRequest.reasonCode,
              reasonText: o.cancelRequest.reasonText,
              bankAccountName: o.cancelRequest.bankAccountName,
              bankAccountNumber: o.cancelRequest.bankAccountNumber,
              bankName: o.cancelRequest.bankName,
              rejectionReason: o.cancelRequest.rejectionReason,
              approvedAt: o.cancelRequest.approvedAt,
              completedAt: o.cancelRequest.completedAt,
            }
          : null,
        cancelRefund: o.refundTransactions.find(row => row.type === 'CANCEL_REFUND')
          ? {
              id: o.refundTransactions.find(row => row.type === 'CANCEL_REFUND')!.id,
              status: o.refundTransactions.find(row => row.type === 'CANCEL_REFUND')!.status,
              amount: o.refundTransactions.find(row => row.type === 'CANCEL_REFUND')!.amount,
              failureReason: o.refundTransactions.find(row => row.type === 'CANCEL_REFUND')!.failureReason,
              requestedAt: o.refundTransactions.find(row => row.type === 'CANCEL_REFUND')!.requestedAt,
              processedAt: o.refundTransactions.find(row => row.type === 'CANCEL_REFUND')!.processedAt,
            }
          : null,
        returnRefund: o.refundTransactions.find(row => row.type === 'RETURN_REFUND')
          ? {
              id: o.refundTransactions.find(row => row.type === 'RETURN_REFUND')!.id,
              status: o.refundTransactions.find(row => row.type === 'RETURN_REFUND')!.status,
              amount: o.refundTransactions.find(row => row.type === 'RETURN_REFUND')!.amount,
              failureReason: o.refundTransactions.find(row => row.type === 'RETURN_REFUND')!.failureReason,
              requestedAt: o.refundTransactions.find(row => row.type === 'RETURN_REFUND')!.requestedAt,
              processedAt: o.refundTransactions.find(row => row.type === 'RETURN_REFUND')!.processedAt,
            }
          : null,
        user: {
          id: o.user.id,
          label: userLabel,
          email: o.user.email,
          phone: o.user.phone,
        },
        shipping: {
          addressId: o.shippingAddress?.sourceAddressId ?? null,
          recipient: o.shippingAddress?.recipientName ?? null,
          phone: o.shippingAddress?.phone ?? null,
          addressLine: o.shippingAddress?.addressLine ?? null,
          ward: o.shippingAddress?.ward ?? null,
          district: o.shippingAddress?.district ?? null,
          city: o.shippingAddress?.city ?? null,
          source: o.shippingAddress?.snapshotSource ?? 'LEGACY_MISSING_SNAPSHOT',
        },
        payment: {
          method: o.payment?.method ?? null,
          status: o.payment?.status ?? null,
          paidAt: o.payment?.paidAt ?? null,
          transactionStatus: o.paymentTransaction?.status ?? null,
          orderCode: o.paymentTransaction?.orderCode ?? null,
          transactionPaidAt: o.paymentTransaction?.paidAt ?? null,
        },
        items: o.items.map((it) => {
          const imageUrl = it.imageUrl ?? pickPrimaryImageUrl({
            variantImages: it.variant?.images,
            productImages: it.product.images,
          });
          return {
            id: it.id,
            productId: it.productId,
            variantId: it.variantId,
            name: it.productName || it.product.name,
            imageUrl,
            attributesText: safeAttributesToText(it.variantAttributes ?? it.variant?.attributes),
            quantity: it.quantity,
            price: it.sellingUnitPrice || it.price,
            lineSubtotal: it.lineSubtotal,
            promotionDiscountAmount: it.promotionDiscountAmount,
            voucherDiscountAmount: it.voucherDiscountAmount,
            lineDiscountAmount: it.lineDiscountAmount,
            lineTotal: it.lineTotal,
            promotionName: it.promotionName,
          };
        }),
      };
    });

    res.status(200).json(
      ResponseFormatter.success(
        {
          items,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
        'Orders fetched successfully',
      ),
    );
  }

  private async exportOrders(req: Request, res: Response): Promise<void> {
    const tab = (req.query.tab as AdminOrderTab | undefined) ?? 'all';
    const search = (req.query.search as string | undefined)?.trim();
    const sort = (req.query.sort as OrderSort | undefined) ?? 'new';
    const requestType = parseRequestType(req.query.requestType);
    const requestStatus = parseRequestStatus(req.query.requestStatus);

    const range = parseDateRangeFilter(req.query);

    const tabWhere = buildTabWhere(tab);
    const requestFilters = buildRequestFilterWhere({ requestType, requestStatus });

    const where: Prisma.OrderWhereInput = {
      ...(requestFilters.length > 0 ? { AND: requestFilters } : {}),
      ...(tabWhere ?? {}),
      ...(range.from || range.to
        ? {
            createdAt: {
              ...(range.from ? { gte: range.from } : {}),
              ...(range.to ? { lt: range.to } : {}),
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              { id: { contains: search } },
              { user: { email: { contains: search } } },
              { paymentTransaction: { orderCode: { contains: search } } },
            ],
          }
        : {}),
    };

    const orderBy: Prisma.OrderOrderByWithRelationInput =
      sort === 'old' ? { createdAt: 'asc' } : { createdAt: 'desc' };

    const orders = await this.prisma.order.findMany({
      where,
      orderBy,
      take: 10000,
      include: {
        user: { select: { email: true, phone: true } },
        payment: { select: { method: true, status: true, paidAt: true } },
        paymentTransaction: { select: { orderCode: true, status: true, paidAt: true } },
        items: {
          select: {
            quantity: true,
            price: true,
            productName: true,
            product: { select: { name: true } },
          },
        },
      },
    });

    const headers = [
      'id',
      'orderCode',
      'createdAt',
      'status',
      'totalPrice',
      'userEmail',
      'userPhone',
      'paymentMethod',
      'paymentStatus',
      'transactionStatus',
      'itemsCount',
      'itemsSummary',
    ];

    const lines = orders.map((order) => {
      const itemsSummary = order.items
        .map((it) => `${it.productName || it.product?.name || ''} x${it.quantity}`)
        .filter((v) => v.trim() !== '')
        .join(' | ');

      return [
        order.id,
        order.paymentTransaction?.orderCode ?? '',
        order.createdAt.toISOString(),
        order.status,
        String(order.totalPrice ?? ''),
        order.user?.email ?? '',
        order.user?.phone ?? '',
        order.payment?.method ? String(order.payment.method) : '',
        order.payment?.status ? String(order.payment.status) : '',
        order.paymentTransaction?.status ? String(order.paymentTransaction.status) : '',
        String(order.items.length),
        itemsSummary,
      ]
        .map((value) => escapeCsvValue(value))
        .join(',');
    });

    const csv = [headers.join(','), ...lines].join('\n');
    const filename = `admin-orders-${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csv);
  }

  private async getCounts(req: Request, res: Response): Promise<void> {
    const range = parseDateRangeFilter(req.query);
    const dateWhere: Prisma.OrderWhereInput = {
        ...(range.from || range.to
          ? {
              createdAt: {
                ...(range.from ? { gte: range.from } : {}),
                ...(range.to ? { lt: range.to } : {}),
              },
            }
          : {}),
    };
    const [rows, waitingReturn, returnInTransit, returnReceived, returnLost, returnDamaged] = await Promise.all([
      this.prisma.order.groupBy({
        by: ['status'],
        where: dateWhere,
        _count: { _all: true },
      }),
      this.prisma.order.count({
        where: {
          ...dateWhere,
          returnStatus: { in: ['APPROVED', 'PICKING'] },
          items: { some: { returns: { some: { status: 'RT_APPROVED', requestType: 'RETURN_REFUND' } } } },
        },
      }),
      this.prisma.order.count({
        where: {
          ...dateWhere,
          returnStatus: 'SHIPPING',
          returnShipment: {
            is: {
              providerStatus: {
                in: [
                  'picked',
                  'storing',
                  'transporting',
                  'sorting',
                  'delivering',
                  'money_collect_delivering',
                ],
              },
            },
          },
        },
      }),
      this.prisma.order.count({
        where: {
          ...dateWhere,
          returnStatus: 'SHIPPING',
          returnShipment: { is: { providerStatus: { in: ['delivered', 'DELIVERED'] } } },
        },
      }),
      this.prisma.order.count({
        where: {
          ...dateWhere,
          returnShipment: { is: { providerStatus: { in: ['lost', 'LOST'] } } },
        },
      }),
      this.prisma.order.count({
        where: {
          ...dateWhere,
          returnShipment: { is: { providerStatus: { in: ['damage', 'DAMAGE'] } } },
        },
      }),
    ]);

    const counts = rows.reduce(
      (acc, r) => {
        acc[r.status] = r._count._all;
        return acc;
      },
      {} as Record<string, number>,
    );

    const pending = counts.PENDING ?? 0;
    const processing = (counts.CONFIRMED ?? 0) + (counts.PAID ?? 0);
    const shipped = (counts.AWAITING_PICKUP ?? 0) + (counts.SHIPPED ?? 0) + (counts.DELIVERING ?? 0);
    const completed = counts.DELIVERED ?? 0;
    const canceled = counts.CANCELLED ?? 0;
    const all = Object.values(counts).reduce((sum, n) => sum + n, 0);

    res
      .status(200)
      .json(
        ResponseFormatter.success(
          {
            all,
            pending,
            processing,
            shipped,
            waitingReturn,
            returnInTransit,
            returnReceived,
            returnLost,
            returnDamaged,
            completed,
            canceled,
          },
          'OK',
        ),
      );
  }

  private async approveReturns(req: Request, res: Response): Promise<void> {
    const rawOrderId = (req.params as any).orderId as string | string[] | undefined;
    const orderId = Array.isArray(rawOrderId) ? rawOrderId[0] : rawOrderId;
    HttpErrorHandler.validateRequired({ orderId }, 'orderId');
    if (!orderId) {
      throw new BadRequestError('orderId is required');
    }

    const actorId = (req as any).userId as string | undefined;

    const result = await this.returnsController.approve(orderId, actorId);
    res
      .status(200)
      .json(
        ResponseFormatter.success(
          { id: result.orderId, returnStatus: result.returnStatus },
          'Returns approved',
        ),
      );
  }

  private async rejectReturns(req: Request, res: Response): Promise<void> {
    const rawOrderId = (req.params as any).orderId as string | string[] | undefined;
    const orderId = Array.isArray(rawOrderId) ? rawOrderId[0] : rawOrderId;
    HttpErrorHandler.validateRequired({ orderId }, 'orderId');
    if (!orderId) {
      throw new BadRequestError('orderId is required');
    }

    const actorId = (req as any).userId as string | undefined;

    const result = await this.returnsController.reject(orderId, actorId);
    res
      .status(200)
      .json(
        ResponseFormatter.success(
          { id: result.orderId, returnStatus: result.returnStatus },
          'Returns rejected',
        ),
      );
  }

  private async pickupReturns(req: Request, res: Response): Promise<void> {
    const rawOrderId = (req.params as any).orderId as string | string[] | undefined;
    const orderId = Array.isArray(rawOrderId) ? rawOrderId[0] : rawOrderId;
    HttpErrorHandler.validateRequired({ orderId }, 'orderId');
    if (!orderId) {
      throw new BadRequestError('orderId is required');
    }

    const actorId = (req as any).userId as string | undefined;
    const result = await this.returnsController.pickedUp(orderId, actorId);

    res
      .status(200)
      .json(
        ResponseFormatter.success(
          { id: result.orderId, returnStatus: result.returnStatus },
          'Return marked as picked up',
        ),
      );
  }

  private async completeReturns(req: Request, res: Response): Promise<void> {
    const rawOrderId = (req.params as any).orderId as string | string[] | undefined;
    const orderId = Array.isArray(rawOrderId) ? rawOrderId[0] : rawOrderId;
    HttpErrorHandler.validateRequired({ orderId }, 'orderId');
    if (!orderId) {
      throw new BadRequestError('orderId is required');
    }

    const actorId = (req as any).userId as string | undefined;

    const result = await this.returnsController.complete(orderId, actorId);
    await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        select: {
          totalPrice: true,
          items: {
            select: {
              id: true,
              quantity: true,
              lineTotal: true,
              returns: {
                where: { status: 'RT_COMPLETED' },
                select: { quantity: true },
              },
            },
          },
        },
      });
      if (order) {
        const refundAmount = order.items.reduce((sum, item) => {
          const returnedQuantity = item.returns.reduce((qty, row) => qty + row.quantity, 0);
          if (returnedQuantity <= 0 || item.quantity <= 0) return sum;
          return sum + (Number(item.lineTotal) * returnedQuantity) / item.quantity;
        }, 0);
        if (refundAmount > 0) {
          await new LoyaltyMutationService(tx).reverseForReference({
            referenceType: 'ORDER',
            referenceId: orderId,
            amount: refundAmount,
            totalAmount: Number(order.totalPrice),
            idempotencyKey: `ORDER:${orderId}:RETURN_REFUND_REVERSE`,
            description: 'Thu hồi điểm theo phần hàng trả/hoàn tiền',
          });
        }
      }
    });
    res
      .status(200)
      .json(
        ResponseFormatter.success(
          { id: result.orderId, status: result.orderStatus, returnStatus: result.returnStatus },
          'Return completed',
        ),
      );
  }

  private async cancelOrder(req: Request, res: Response): Promise<void> {
    const rawOrderId = (req.params as any).orderId as string | string[] | undefined;
    const orderId = Array.isArray(rawOrderId) ? rawOrderId[0] : rawOrderId;
    HttpErrorHandler.validateRequired({ orderId }, 'orderId');
    if (!orderId) {
      throw new BadRequestError('orderId is required');
    }

    const actorId = (req as any).userId as string | undefined;
    if (!actorId) {
      throw new ForbiddenError('Authentication required');
    }

    const reasonInput = (req.body as { reason?: unknown } | undefined)?.reason;
    const cancelReason =
      typeof reasonInput === 'string' && reasonInput.trim().length > 0 ? reasonInput.trim() : null;

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        userId: true,
        totalPrice: true,
        payment: {
          select: {
            status: true,
          },
        },
        paymentTransaction: {
          select: {
            orderCode: true,
          },
        },
      },
    });

    if (!order) {
      throw new BadRequestError('Order not found');
    }

    if (order.status === 'CANCELLED') {
      res.status(200).json(ResponseFormatter.success({ id: order.id, status: order.status }, 'OK'));
      return;
    }

    if (['SHIPPED', 'DELIVERED', 'RETURNED'].includes(order.status)) {
      throw new BadRequestError('Cannot cancel an order that is already shipped/delivered');
    }

    if (order.status === 'PAID' && !cancelReason) {
      throw new BadRequestError('Cancellation reason is required for paid orders');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' },
        select: { id: true, status: true },
      });

      if (['PENDING', 'CONFIRMED'].includes(order.status)) {
        await this.releaseReservedStockForOrder(tx, orderId);
      }

      await tx.paymentTransaction.updateMany({
        where: { orderId, status: 'PENDING' },
        data: {
          status: 'FAILED',
          gatewayCode: 'ORD_CANCEL',
          gatewayStatus: 'CANCELLED',
        },
      });

      await tx.payment.updateMany({
        where: { orderId, status: 'PENDING' },
        data: { status: 'FAILED' },
      });

      const isPaidOrder =
        order.status === 'PAID' ||
        order.payment?.status === 'PAID' ||
        order.payment?.status === 'SUCCESS';
      if (isPaidOrder) {
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
            initiatedBy: 'ADMIN',
            reason: cancelReason ?? 'Order cancelled by admin',
            idempotencyKey: `cancel-${orderId}`,
          },
          update: {
            status: 'PENDING',
            failureReason: null,
            reason: cancelReason ?? 'Order cancelled by admin',
            initiatedBy: 'ADMIN',
          },
        });
      }

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          oldStatus: order.status,
          newStatus: 'CANCELLED',
          changedBy: actorId,
        },
      });

      await tx.notification.create({
        data: {
          userId: order.userId,
          content: buildOrderCancelledNotificationContent({
            orderId,
            orderCode: order.paymentTransaction?.orderCode ?? null,
            reason: cancelReason,
          }),
          isRead: false,
        },
      });

      await tx.auditLog.create({
        data: {
          actorType: 'ADMIN',
          actorId,
          targetType: 'ORDER',
          targetId: orderId,
          action: 'ADMIN_CANCEL_ORDER',
          oldData: {
            status: order.status,
          },
          newData: {
            status: 'CANCELLED',
            reason: cancelReason,
          },
        },
      });

      return updatedOrder;
    });

    res.status(200).json(ResponseFormatter.success(updated, 'Order cancelled'));
  }

  private async releaseReservedStockForOrder(
    tx: Prisma.TransactionClient,
    orderId: string,
  ): Promise<void> {
    const items = await tx.orderItem.findMany({
      where: { orderId },
      select: { variantId: true, quantity: true },
    });

    const quantityByVariantId = new Map<string, number>();
    for (const item of items) {
      if (!item.variantId) continue;
      quantityByVariantId.set(
        item.variantId,
        (quantityByVariantId.get(item.variantId) ?? 0) + item.quantity,
      );
    }

    for (const [variantId, quantity] of quantityByVariantId.entries()) {
      const updated = await tx.productVariant.updateMany({
        where: {
          id: variantId,
          stockReserved: { gte: quantity },
        },
        data: {
          stockReserved: { decrement: quantity },
          stockAvailable: { increment: quantity },
        },
      });

      if (updated.count === 0) {
        const current = await tx.productVariant.findUnique({
          where: { id: variantId },
          select: { stockReserved: true, stockAvailable: true, stockOnHand: true },
        });

        if (!current) continue;

        const nextReserved = Math.max(0, current.stockReserved - quantity);
        const nextAvailable = Math.min(
          current.stockOnHand,
          Math.max(0, current.stockAvailable + quantity),
        );

        await tx.productVariant.update({
          where: { id: variantId },
          data: {
            stockReserved: nextReserved,
            stockAvailable: nextAvailable,
          },
        });
      }
    }
  }

  private async approveCancelRequest(req: Request, res: Response): Promise<void> {
    const orderId = String(req.params.orderId || '');
    if (!orderId) {
      throw new BadRequestError('orderId is required');
    }

    const actorId = req.userId;
    if (!actorId) {
      throw new ForbiddenError('Authentication required');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        cancelRequest: true,
      },
    });

    if (!order || !order.cancelRequest) {
      throw new BadRequestError('Cancel request not found');
    }

    if (!['PAID', 'CONFIRMED'].includes(order.status)) {
      throw new BadRequestError('Only paid processing orders can be approved for cancellation');
    }

    if (order.cancelRequest.status !== 'REQUESTED') {
      throw new BadRequestError('Only requested cancel request can be approved');
    }

    const updated = await this.prisma.orderCancelRequest.update({
      where: { orderId },
      data: {
        status: 'APPROVED',
        approvedByAdminId: actorId,
        approvedAt: new Date(),
        rejectedAt: null,
        rejectedByAdminId: null,
        rejectionReason: null,
      },
    });

    res.status(200).json(
      ResponseFormatter.success(
        {
          orderId,
          cancelRequestStatus: updated.status,
          bankAccountName: updated.bankAccountName,
          bankAccountNumber: updated.bankAccountNumber,
          bankName: updated.bankName,
        },
        'Cancel request approved',
      ),
    );
  }

  private async rejectCancelRequest(req: Request, res: Response): Promise<void> {
    const orderId = String(req.params.orderId || '');
    if (!orderId) {
      throw new BadRequestError('orderId is required');
    }

    const actorId = req.userId;
    if (!actorId) {
      throw new ForbiddenError('Authentication required');
    }

    const rejectionReason = String((req.body as any)?.rejectionReason || '').trim();
    if (!rejectionReason) {
      throw new BadRequestError('rejectionReason is required');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { cancelRequest: true },
    });
    if (!order || !order.cancelRequest) {
      throw new BadRequestError('Cancel request not found');
    }

    if (order.cancelRequest.status !== 'REQUESTED') {
      throw new BadRequestError('Only requested cancel request can be rejected');
    }

    const updated = await this.prisma.orderCancelRequest.update({
      where: { orderId },
      data: {
        status: 'REJECTED',
        rejectedByAdminId: actorId,
        rejectedAt: new Date(),
        rejectionReason: rejectionReason.slice(0, 500),
      },
    });

    res.status(200).json(
      ResponseFormatter.success(
        {
          orderId,
          cancelRequestStatus: updated.status,
          rejectionReason: updated.rejectionReason,
        },
        'Cancel request rejected',
      ),
    );
  }

  private async completeCancelRefund(req: Request, res: Response): Promise<void> {
    const orderId = String(req.params.orderId || '');
    if (!orderId) {
      throw new BadRequestError('orderId is required');
    }

    const actorId = req.userId;
    if (!actorId) {
      throw new ForbiddenError('Authentication required');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payment: true,
        paymentTransaction: { select: { orderCode: true } },
        cancelRequest: true,
        refundTransactions: {
          where: { type: 'CANCEL_REFUND' },
          orderBy: { requestedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!order || !order.cancelRequest) {
      throw new BadRequestError('Cancel request not found');
    }

    if (order.cancelRequest.status !== 'APPROVED') {
      throw new BadRequestError('Cancel request must be approved before completing refund');
    }

    const cancelRequest = order.cancelRequest;

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.orderCancelRequest.update({
        where: { orderId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      await tx.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          oldStatus: order.status,
          newStatus: 'CANCELLED',
          changedBy: actorId,
        },
      });

      await tx.notification.create({
        data: {
          userId: order.userId,
          content: buildOrderCancelledNotificationContent({
            orderId,
            orderCode: order.paymentTransaction?.orderCode ?? null,
            reason:
              cancelRequest.reasonText?.trim() ||
              mapCancelReasonCodeToText(cancelRequest.reasonCode),
          }),
          isRead: false,
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
          status: 'SUCCESS',
          initiatedBy: 'ADMIN',
          provider: 'MANUAL',
          providerRefundId: `manual-${orderId.slice(0, 8)}-${Date.now()}`,
          idempotencyKey: `cancel-${orderId}`,
          processedAt: new Date(),
          reason: 'Manual refund completed by admin',
        },
        update: {
          status: 'SUCCESS',
          initiatedBy: 'ADMIN',
          provider: 'MANUAL',
          processedAt: new Date(),
          failureReason: null,
          reason: 'Manual refund completed by admin',
        },
      });

      if (order.payment) {
        await tx.payment.update({
          where: { id: order.payment.id },
          data: { status: 'REFUNDED' },
        });
      }

      await new LoyaltyMutationService(tx).reverseForReference({
        referenceType: 'ORDER',
        referenceId: orderId,
        amount: Number(order.totalPrice),
        totalAmount: Number(order.totalPrice),
        idempotencyKey: `ORDER:${orderId}:CANCEL_REFUND_REVERSE`,
        description: 'Thu hồi điểm từ đơn hàng đã hủy và hoàn tiền',
      });

      return {
        orderId,
        status: 'CANCELLED',
      };
    });

    res.status(200).json(ResponseFormatter.success(updated, 'Manual refund marked as completed'));
  }
}
