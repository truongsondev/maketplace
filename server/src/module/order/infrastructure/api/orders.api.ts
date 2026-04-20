import express, { Request, Response } from 'express';
import type { CancelReason } from '@/generated/prisma/enums';
import { prisma } from '../../../../infrastructure/database';
import { asyncHandler } from '../../../../shared/server/error-middleware';
import { ResponseFormatter } from '../../../../shared/server/api-response';
import { BadRequestError } from '../../../../error-handlling/badRequestError';
import type { OrderReturnsController } from '../../interface-adapter/controller/order-returns.controller';
import type { OrdersController } from '../../interface-adapter/controller/orders.controller';
import type { OrderSort, OrderTab } from '../../applications/dto/order.dto';

function parsePositiveInt(value: unknown, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.floor(n);
}

function parseCancelReason(value: unknown): CancelReason {
  const reason = String(value || '').toUpperCase();
  if (reason === 'NO_LONGER_NEEDED') return 'NO_LONGER_NEEDED';
  if (reason === 'BUY_OTHER_ITEM') return 'BUY_OTHER_ITEM';
  if (reason === 'FOUND_CHEAPER') return 'FOUND_CHEAPER';
  if (reason === 'OTHER') return 'OTHER';
  throw new BadRequestError('Invalid cancel reason');
}

function parseOrderCancelledNotification(content: string): {
  message: string;
  relatedPath: string | null;
} {
  const markerRegex = /^\[ORDER_CANCELLED\|([^\]]+)\]\s*/;
  const match = content.match(markerRegex);
  if (!match) {
    return {
      message: content,
      relatedPath: null,
    };
  }

  const orderId = match[1]?.trim();
  const message = content.replace(markerRegex, '').trim();
  return {
    message,
    relatedPath: orderId ? `/orders?orderId=${encodeURIComponent(orderId)}` : '/orders',
  };
}

export class OrdersAPI {
  readonly router = express.Router();

  constructor(
    private readonly ordersController: OrdersController,
    private readonly orderReturnsController: OrderReturnsController,
  ) {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    if (process.env.NODE_ENV === 'development') {
      this.router.get('/_debug/me', asyncHandler(this.debugMe.bind(this)));
    }

    this.router.get('/', asyncHandler(this.listMyOrders.bind(this)));
    this.router.get('/notifications', asyncHandler(this.listMyNotifications.bind(this)));
    this.router.patch(
      '/notifications/read-all',
      asyncHandler(this.markAllNotificationsAsRead.bind(this)),
    );
    this.router.patch(
      '/notifications/:id/read',
      asyncHandler(this.markNotificationAsRead.bind(this)),
    );
    this.router.get('/counts', asyncHandler(this.getMyCounts.bind(this)));
    this.router.get('/:orderId', asyncHandler(this.getMyOrderDetail.bind(this)));
    this.router.post('/:orderId/cancel', asyncHandler(this.cancelMyOrder.bind(this)));
    this.router.post('/:orderId/cancel-request', asyncHandler(this.requestPaidCancel.bind(this)));
    this.router.post('/:orderId/confirm-received', asyncHandler(this.confirmReceived.bind(this)));
    this.router.post('/:orderId/return', asyncHandler(this.requestReturn.bind(this)));
  }

  private async debugMe(req: Request, res: Response): Promise<void> {
    const userId = req.userId;
    const user = (req as any).user as { id?: string; email?: string } | undefined;

    res.status(200).json(
      ResponseFormatter.success(
        {
          userId: userId ?? null,
          email: user?.email ?? null,
        },
        'OK',
      ),
    );
  }

  private async requestPaidCancel(req: Request, res: Response): Promise<void> {
    const userId = req.userId;
    if (!userId) {
      throw new BadRequestError('User ID not found');
    }

    const rawOrderId = (req.params as any).orderId as string | string[] | undefined;
    const orderId = Array.isArray(rawOrderId) ? rawOrderId[0] : rawOrderId;
    if (!orderId) {
      throw new BadRequestError('orderId is required');
    }

    const reasonCode = parseCancelReason((req.body as any)?.reasonCode);
    const reasonTextRaw = String((req.body as any)?.reasonText || '').trim();
    const reasonText = reasonTextRaw ? reasonTextRaw.slice(0, 500) : null;
    const bankAccountName = String((req.body as any)?.bankAccountName || '').trim();
    const bankAccountNumber = String((req.body as any)?.bankAccountNumber || '').trim();
    const bankName = String((req.body as any)?.bankName || '').trim();

    if (!bankAccountName || !bankAccountNumber || !bankName) {
      throw new BadRequestError('bankAccountName, bankAccountNumber and bankName are required');
    }

    if (reasonCode === 'OTHER' && !reasonText) {
      throw new BadRequestError('reasonText is required when reasonCode is OTHER');
    }

    const updated = await this.ordersController.requestPaidCancel(userId, {
      orderId,
      reasonCode,
      reasonText,
      bankAccountName,
      bankAccountNumber,
      bankName,
    });

    res.status(200).json(
      ResponseFormatter.success(
        {
          id: updated.id,
          status: updated.status,
          cancelRequestStatus: updated.cancelRequestStatus,
        },
        'Cancellation request submitted, waiting for admin approval',
      ),
    );
  }

  private async confirmReceived(req: Request, res: Response): Promise<void> {
    const userId = req.userId;
    if (!userId) {
      throw new BadRequestError('User ID not found');
    }

    const rawOrderId = (req.params as any).orderId as string | string[] | undefined;
    const orderId = Array.isArray(rawOrderId) ? rawOrderId[0] : rawOrderId;
    if (!orderId) {
      throw new BadRequestError('orderId is required');
    }

    const updated = await this.ordersController.confirmReceived(userId, orderId);
    res.status(200).json(ResponseFormatter.success(updated, 'Order confirmed as received'));
  }

  private async requestReturn(req: Request, res: Response): Promise<void> {
    const userId = req.userId;
    if (!userId) {
      throw new BadRequestError('User ID not found');
    }

    const rawOrderId = (req.params as any).orderId as string | string[] | undefined;
    const orderId = Array.isArray(rawOrderId) ? rawOrderId[0] : rawOrderId;
    if (!orderId) {
      throw new BadRequestError('orderId is required');
    }

    const reason = (req.body as any)?.reason;

    const result = await this.orderReturnsController.requestReturn({
      userId,
      orderId,
      reason: typeof reason === 'string' ? reason : null,
    });

    res
      .status(200)
      .json(
        ResponseFormatter.success(
          { id: result.orderId, status: result.orderStatus, returnStatus: result.returnStatus },
          'Return requested',
        ),
      );
  }

  private async listMyOrders(req: Request, res: Response): Promise<void> {
    const userId = req.userId;
    console.log('OrdersAPI.listMyOrders called with userId:', userId);
    if (!userId) {
      throw new BadRequestError('User ID not found');
    }

    const tab = (req.query.tab as OrderTab | undefined) ?? 'all';
    const search = (req.query.search as string | undefined)?.trim();
    const sort = (req.query.sort as OrderSort | undefined) ?? 'new';

    const page = parsePositiveInt(req.query.page, 1);
    const limit = Math.min(parsePositiveInt(req.query.limit, 10), 50);
    const result = await this.ordersController.listMyOrders(userId, {
      tab,
      search: search ?? null,
      sort,
      page,
      limit,
    });

    res.status(200).json(ResponseFormatter.success(result, 'Orders fetched successfully'));
  }

  private async getMyCounts(req: Request, res: Response): Promise<void> {
    const userId = req.userId;
    if (!userId) {
      throw new BadRequestError('User ID not found');
    }

    const result = await this.ordersController.getMyCounts(userId);
    res.status(200).json(ResponseFormatter.success(result, 'OK'));
  }

  private async getMyOrderDetail(req: Request, res: Response): Promise<void> {
    const userId = req.userId;
    if (!userId) {
      throw new BadRequestError('User ID not found');
    }

    const rawOrderId = (req.params as any).orderId as string | string[] | undefined;
    const orderId = Array.isArray(rawOrderId) ? rawOrderId[0] : rawOrderId;
    if (!orderId) {
      throw new BadRequestError('orderId is required');
    }

    const dto = await this.ordersController.getMyOrderDetail(userId, orderId);
    res.status(200).json(ResponseFormatter.success(dto, 'OK'));
  }

  private async cancelMyOrder(req: Request, res: Response): Promise<void> {
    const userId = req.userId;
    if (!userId) {
      throw new BadRequestError('User ID not found');
    }

    const rawOrderId = (req.params as any).orderId as string | string[] | undefined;
    const orderId = Array.isArray(rawOrderId) ? rawOrderId[0] : rawOrderId;
    if (!orderId) {
      throw new BadRequestError('orderId is required');
    }

    const updated = await this.ordersController.cancelMyOrder(userId, orderId);
    res.status(200).json(ResponseFormatter.success(updated, 'Order cancelled'));
  }

  private async listMyNotifications(req: Request, res: Response): Promise<void> {
    const userId = req.userId;
    if (!userId) {
      throw new BadRequestError('User ID not found');
    }

    const page = parsePositiveInt(req.query.page, 1);
    const limit = Math.min(parsePositiveInt(req.query.limit, 20), 100);
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          content: true,
          isRead: true,
          createdAt: true,
        },
      }),
      prisma.notification.count({ where: { userId } }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    res.status(200).json(
      ResponseFormatter.success({
        items: notifications.map((item) => {
          const parsed = parseOrderCancelledNotification(item.content);
          return {
            id: item.id,
            content: parsed.message,
            isRead: item.isRead,
            createdAt: item.createdAt,
            relatedPath: parsed.relatedPath,
          };
        }),
        total,
        page,
        limit,
        unreadCount,
      }),
    );
  }

  private async markNotificationAsRead(req: Request, res: Response): Promise<void> {
    const userId = req.userId;
    if (!userId) {
      throw new BadRequestError('User ID not found');
    }

    const notificationId = String(req.params.id || '').trim();
    if (!notificationId) {
      throw new BadRequestError('notificationId is required');
    }

    const updated = await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    res.status(200).json(ResponseFormatter.success({ updated: updated.count > 0 }));
  }

  private async markAllNotificationsAsRead(req: Request, res: Response): Promise<void> {
    const userId = req.userId;
    if (!userId) {
      throw new BadRequestError('User ID not found');
    }

    const updated = await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    res.status(200).json(ResponseFormatter.success({ updatedCount: updated.count }));
  }
}
