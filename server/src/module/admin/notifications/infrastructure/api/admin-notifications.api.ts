import express, { Request, Response } from 'express';
import { BadRequestError } from '../../../../../error-handlling/badRequestError';
import { ResponseFormatter } from '../../../../../shared/server/api-response';
import { asyncHandler } from '../../../../../shared/server/error-middleware';
import { AdminNotificationsController } from '../../interface-adapter/controller/admin-notifications.controller';
import { adminNotificationHub } from '../realtime/admin-notification-hub';

function parsePositiveInt(value: unknown, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

export class AdminNotificationsAPI {
  readonly router = express.Router();

  constructor(private readonly controller: AdminNotificationsController) {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get('/', asyncHandler(this.list.bind(this)));
    this.router.patch('/read-all', asyncHandler(this.markAllAsRead.bind(this)));
    this.router.patch('/:id/read', asyncHandler(this.markAsRead.bind(this)));
    this.router.get('/stream', asyncHandler(this.stream.bind(this)));
  }

  private async list(req: Request, res: Response): Promise<void> {
    const userId = req.userId;
    if (!userId) throw new BadRequestError('User ID not found');

    const page = parsePositiveInt(req.query.page, 1);
    const limit = Math.min(100, parsePositiveInt(req.query.limit, 20));

    const result = await this.controller.list(userId, page, limit);
    res.status(200).json(ResponseFormatter.success(result));
  }

  private async markAsRead(req: Request, res: Response): Promise<void> {
    const userId = req.userId;
    if (!userId) throw new BadRequestError('User ID not found');

    const rawNotificationId = req.params.id;
    const notificationId =
      typeof rawNotificationId === 'string' ? rawNotificationId : rawNotificationId?.[0];
    if (!notificationId) throw new BadRequestError('notificationId is required');

    const updated = await this.controller.markAsRead(userId, notificationId);
    res.status(200).json(ResponseFormatter.success({ updated }));
  }

  private async markAllAsRead(req: Request, res: Response): Promise<void> {
    const userId = req.userId;
    if (!userId) throw new BadRequestError('User ID not found');

    const updatedCount = await this.controller.markAllAsRead(userId);
    res.status(200).json(ResponseFormatter.success({ updatedCount }));
  }

  private async stream(req: Request, res: Response): Promise<void> {
    const userId = req.userId;
    if (!userId) throw new BadRequestError('User ID not found');

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    res.flushHeaders();
    res.write('event: connected\n');
    res.write(`data: ${JSON.stringify({ connectedAt: new Date().toISOString() })}\n\n`);

    const clientId = adminNotificationHub.addClient(userId, res);

    const keepAlive = setInterval(() => {
      adminNotificationHub.sendKeepAlive(clientId);
    }, 25_000);

    req.on('close', () => {
      clearInterval(keepAlive);
      adminNotificationHub.removeClient(clientId);
      res.end();
    });
  }
}
