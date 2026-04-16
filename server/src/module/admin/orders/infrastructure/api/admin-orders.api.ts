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

type AdminOrderTab = 'all' | 'pending' | 'processing' | 'shipped' | 'completed' | 'canceled';
type OrderSort = 'new' | 'old';

function parsePositiveInt(value: unknown, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.floor(n);
}

function mapTabToStatuses(tab: AdminOrderTab | undefined): OrderStatus[] | undefined {
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

function escapeCsvValue(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export class AdminOrdersAPI {
  readonly router = express.Router();

  constructor(
    private readonly prisma: PrismaClient,
    private readonly returnsController: AdminOrderReturnsController,
    private readonly analyticsController: AdminOrderAnalyticsController,
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
    this.router.post('/:orderId/confirm', asyncHandler(this.confirmOrder.bind(this)));
    this.router.post('/:orderId/ship', asyncHandler(this.shipOrder.bind(this)));
    this.router.post('/:orderId/deliver', asyncHandler(this.deliverOrder.bind(this)));
    this.router.post('/:orderId/returns/approve', asyncHandler(this.approveReturns.bind(this)));
    this.router.post('/:orderId/returns/reject', asyncHandler(this.rejectReturns.bind(this)));
    this.router.post('/:orderId/returns/pickup', asyncHandler(this.pickupReturns.bind(this)));
    this.router.post('/:orderId/returns/complete', asyncHandler(this.completeReturns.bind(this)));
  }

  private async getAnalyticsStatus(req: Request, res: Response): Promise<void> {
    const days = parsePositiveInt(req.query.days, 30);
    const result = await this.analyticsController.getStatusBreakdown({ days });
    res.status(200).json(ResponseFormatter.success(result, 'OK'));
  }

  private async getAnalyticsTimeseries(req: Request, res: Response): Promise<void> {
    const days = parsePositiveInt(req.query.days, 30);
    const result = await this.analyticsController.getTimeseries({ days });
    res.status(200).json(ResponseFormatter.success(result, 'OK'));
  }

  private async transitionStatus(params: {
    orderId: string;
    actorId: string;
    to: OrderStatus;
    allowedFrom: OrderStatus[];
    okIfAlreadyIn?: OrderStatus[];
  }): Promise<{ id: string; status: OrderStatus }> {
    const { orderId, actorId, to, allowedFrom, okIfAlreadyIn } = params;

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true },
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
        data: { status: to },
        select: { id: true, status: true },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          oldStatus: order.status,
          newStatus: to,
          changedBy: actorId,
        },
      });

      return updatedOrder;
    });

    return updated;
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

    const updated = await this.transitionStatus({
      orderId,
      actorId,
      to: 'CONFIRMED',
      allowedFrom: ['PAID'],
      okIfAlreadyIn: ['CONFIRMED', 'SHIPPED', 'DELIVERED', 'RETURNED'],
    });

    res.status(200).json(ResponseFormatter.success(updated, 'Order confirmed'));
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

    const updated = await this.transitionStatus({
      orderId,
      actorId,
      to: 'SHIPPED',
      allowedFrom: ['CONFIRMED'],
      okIfAlreadyIn: ['SHIPPED', 'DELIVERED', 'RETURNED'],
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

    const updated = await this.transitionStatus({
      orderId,
      actorId,
      to: 'DELIVERED',
      allowedFrom: ['SHIPPED'],
      okIfAlreadyIn: ['DELIVERED', 'RETURNED'],
    });

    res.status(200).json(ResponseFormatter.success(updated, 'Order delivered'));
  }

  private async listOrders(req: Request, res: Response): Promise<void> {
    const tab = (req.query.tab as AdminOrderTab | undefined) ?? 'all';
    const search = (req.query.search as string | undefined)?.trim();
    const sort = (req.query.sort as OrderSort | undefined) ?? 'new';

    const page = parsePositiveInt(req.query.page, 1);
    const limit = Math.min(parsePositiveInt(req.query.limit, 10), 50);
    const skip = (page - 1) * limit;

    const statuses = mapTabToStatuses(tab);

    const where: Prisma.OrderWhereInput = {
      ...(statuses ? { status: { in: statuses } } : {}),
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
          user: { select: { id: true, email: true, phone: true } },
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
              rejectionReason: true,
              approvedAt: true,
              completedAt: true,
            },
          },
          refundTransactions: {
            where: { type: 'CANCEL_REFUND' },
            select: {
              id: true,
              status: true,
              amount: true,
              failureReason: true,
              requestedAt: true,
              processedAt: true,
            },
            orderBy: { requestedAt: 'desc' },
            take: 1,
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
                },
              },
            },
          },
        },
      }),
    ]);

    const items = orders.map((o) => {
      const userLabel = o.user.email ?? o.user.phone ?? o.user.id;

      const returnsSummary = { requested: 0, approved: 0, rejected: 0, completed: 0 };
      for (const it of o.items) {
        for (const r of it.returns ?? []) {
          if (r.status === 'REQUESTED') returnsSummary.requested += 1;
          else if (r.status === 'APPROVED') returnsSummary.approved += 1;
          else if (r.status === 'REJECTED') returnsSummary.rejected += 1;
          else if (r.status === 'COMPLETED') returnsSummary.completed += 1;
        }
      }

      return {
        id: o.id,
        createdAt: o.createdAt,
        status: o.status,
        returnStatus: o.returnStatus ?? null,
        totalPrice: o.totalPrice,
        returns: returnsSummary,
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
        cancelRefund: o.refundTransactions[0]
          ? {
              id: o.refundTransactions[0].id,
              status: o.refundTransactions[0].status,
              amount: o.refundTransactions[0].amount,
              failureReason: o.refundTransactions[0].failureReason,
              requestedAt: o.refundTransactions[0].requestedAt,
              processedAt: o.refundTransactions[0].processedAt,
            }
          : null,
        user: {
          id: o.user.id,
          label: userLabel,
          email: o.user.email,
          phone: o.user.phone,
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
            price: it.price,
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

    const statuses = mapTabToStatuses(tab);

    const where: Prisma.OrderWhereInput = {
      ...(statuses ? { status: { in: statuses } } : {}),
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
        .map((it) => `${it.product?.name ?? ''} x${it.quantity}`)
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
    const rows = await this.prisma.order.groupBy({
      by: ['status'],
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

    res
      .status(200)
      .json(
        ResponseFormatter.success({ all, pending, processing, shipped, completed, canceled }, 'OK'),
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

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true },
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

    if (order.status === 'PAID') {
      throw new BadRequestError('Use cancel request approval flow for paid orders');
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
          changedBy: actorId,
        },
      });

      return updatedOrder;
    });

    res.status(200).json(ResponseFormatter.success(updated, 'Order cancelled'));
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

      return {
        orderId,
        status: 'CANCELLED',
      };
    });

    res.status(200).json(ResponseFormatter.success(updated, 'Manual refund marked as completed'));
  }
}
