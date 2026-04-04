import express, { Request, Response } from 'express';
import type { Prisma, PrismaClient } from '@/generated/prisma/client';
import type { OrderStatus } from '@/generated/prisma/enums';
import { asyncHandler } from '../../../../../shared/server/error-middleware';
import { ResponseFormatter } from '../../../../../shared/server/api-response';
import { HttpErrorHandler } from '../../../../../shared/server/http-error-handler';
import { BadRequestError } from '../../../../../error-handlling/badRequestError';
import { ForbiddenError } from '../../../../../error-handlling/forbiddenError';

type AdminOrderTab = 'all' | 'pending' | 'processing' | 'shipped' | 'canceled';
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
  if (tab === 'shipped') return ['SHIPPED', 'DELIVERED'];
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

export class AdminOrdersAPI {
  readonly router = express.Router();

  constructor(private readonly prisma: PrismaClient) {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get('/', asyncHandler(this.listOrders.bind(this)));
    this.router.get('/counts', asyncHandler(this.getCounts.bind(this)));
    this.router.post('/:orderId/cancel', asyncHandler(this.cancelOrder.bind(this)));
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
            },
          },
        },
      }),
    ]);

    const items = orders.map((o) => {
      const userLabel = o.user.email ?? o.user.phone ?? o.user.id;
      return {
        id: o.id,
        createdAt: o.createdAt,
        status: o.status,
        totalPrice: o.totalPrice,
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
    const shipped = (counts.SHIPPED ?? 0) + (counts.DELIVERED ?? 0);
    const canceled = counts.CANCELLED ?? 0;
    const all = Object.values(counts).reduce((sum, n) => sum + n, 0);

    res
      .status(200)
      .json(ResponseFormatter.success({ all, pending, processing, shipped, canceled }, 'OK'));
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
}
