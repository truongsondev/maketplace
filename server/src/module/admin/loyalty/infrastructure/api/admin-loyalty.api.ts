import express, { type Request, type Response } from 'express';
import type { PrismaClient } from '@/generated/prisma/client';
import { BadRequestError } from '../../../../../error-handlling/badRequestError';
import { ForbiddenError } from '../../../../../error-handlling/forbiddenError';
import { ResponseFormatter } from '../../../../../shared/server/api-response';
import { asyncHandler } from '../../../../../shared/server/error-middleware';
import { LoyaltyMutationService, LoyaltyQueryService } from '../../../../user-profile/loyalty.service';

export class AdminLoyaltyAPI {
  readonly router = express.Router();

  constructor(private readonly prisma: PrismaClient) {
    this.router.get('/config', asyncHandler(this.getConfig.bind(this)));
    this.router.put('/config', asyncHandler(this.updateConfig.bind(this)));
    this.router.get('/accounts', asyncHandler(this.listAccounts.bind(this)));
    this.router.post('/accounts/by-email/adjust', asyncHandler(this.adjustByEmail.bind(this)));
    this.router.get('/accounts/:userId', asyncHandler(this.getAccount.bind(this)));
    this.router.post('/accounts/:userId/adjust', asyncHandler(this.adjust.bind(this)));
    this.router.post('/expire', asyncHandler(this.expire.bind(this)));
  }

  private async getConfig(_req: Request, res: Response): Promise<void> {
    const service = new LoyaltyQueryService(this.prisma);
    res.status(200).json(ResponseFormatter.success(await service.getConfig()));
  }

  private async updateConfig(req: Request, res: Response): Promise<void> {
    if (!req.userId) throw new ForbiddenError('Authentication required');
    const body = req.body as Record<string, unknown>;
    const spendPerPoint = Number(body.spendPerPoint);
    const pointValidityDays = Number(body.pointValidityDays);
    const silverMinPoints = Number(body.silverMinPoints);
    const goldMinPoints = Number(body.goldMinPoints);
    const isActive = Boolean(body.isActive);

    if (
      !Number.isInteger(spendPerPoint) ||
      spendPerPoint < 1 ||
      !Number.isInteger(pointValidityDays) ||
      pointValidityDays < 1 ||
      !Number.isInteger(silverMinPoints) ||
      silverMinPoints < 0 ||
      !Number.isInteger(goldMinPoints) ||
      goldMinPoints <= silverMinPoints
    ) {
      throw new BadRequestError('Invalid loyalty configuration');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const current = await tx.loyaltyConfig.upsert({
        where: { id: 1 },
        create: { id: 1 },
        update: {},
      });
      const updated = await tx.loyaltyConfig.update({
        where: { id: 1 },
        data: { spendPerPoint, pointValidityDays, silverMinPoints, goldMinPoints, isActive },
      });
      await tx.auditLog.create({
        data: {
          actorType: 'ADMIN',
          actorId: req.userId,
          targetType: 'LOYALTY_CONFIG',
          targetId: '1',
          action: 'LOYALTY_CONFIG_UPDATED',
          oldData: current,
          newData: updated,
        },
      });
      return updated;
    });

    res.status(200).json(ResponseFormatter.success(result, 'Loyalty config updated'));
  }

  private async listAccounts(req: Request, res: Response): Promise<void> {
    const search = String(req.query.search || '').trim();
    const rows = await this.prisma.loyaltyAccount.findMany({
      where: search
        ? {
            user: {
              OR: [
                { email: { contains: search } },
                { phone: { contains: search } },
              ],
            },
          }
        : undefined,
      include: {
        user: { select: { id: true, email: true, phone: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });
    res.status(200).json(ResponseFormatter.success({ items: rows }));
  }

  private async getAccount(req: Request, res: Response): Promise<void> {
    const userId = String(req.params.userId || '');
    const account = await this.prisma.loyaltyAccount.findUnique({
      where: { userId },
      include: {
        user: { select: { id: true, email: true, phone: true } },
        transactions: { orderBy: { createdAt: 'desc' }, take: 100 },
      },
    });
    res.status(200).json(ResponseFormatter.success(account ?? null));
  }

  private async adjust(req: Request, res: Response): Promise<void> {
    if (!req.userId) throw new ForbiddenError('Authentication required');
    const userId = String(req.params.userId || '');
    const body = req.body as Record<string, unknown>;
    const points = Number(body.points);
    const reason = String(body.reason || '').trim();
    const idempotencyKey = String(req.header('Idempotency-Key') || body.idempotencyKey || '').trim();
    if (!userId) throw new BadRequestError('userId is required');

    const result = await this.prisma.$transaction(async (tx) => {
      const service = new LoyaltyMutationService(tx);
      const changed = await service.adjust({
        userId,
        points,
        reason,
        actorId: req.userId,
        idempotencyKey: idempotencyKey || undefined,
      });
      await tx.auditLog.create({
        data: {
          actorType: 'ADMIN',
          actorId: req.userId,
          targetType: 'LOYALTY_ACCOUNT',
          targetId: userId,
          action: 'LOYALTY_POINTS_ADJUSTED',
          newData: { points, reason, changed },
        },
      });
      return { changed };
    });

    res.status(200).json(ResponseFormatter.success(result, 'Loyalty points adjusted'));
  }

  private async adjustByEmail(req: Request, res: Response): Promise<void> {
    if (!req.userId) throw new ForbiddenError('Authentication required');
    const body = req.body as Record<string, unknown>;
    const email = String(body.email || '').trim().toLowerCase();
    const points = Number(body.points);
    const reason = String(body.reason || '').trim();
    const idempotencyKey = String(req.header('Idempotency-Key') || body.idempotencyKey || '').trim();
    if (!email) throw new BadRequestError('email is required');

    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (!user) throw new BadRequestError('Không tìm thấy người dùng với email này');

    const result = await this.prisma.$transaction(async (tx) => {
      const changed = await new LoyaltyMutationService(tx).adjust({
        userId: user.id,
        points,
        reason,
        actorId: req.userId!,
        idempotencyKey: idempotencyKey || undefined,
      });
      await tx.auditLog.create({
        data: {
          actorType: 'ADMIN', actorId: req.userId!, targetType: 'LOYALTY_ACCOUNT',
          targetId: user.id, action: 'LOYALTY_POINTS_ADJUSTED',
          newData: { email, points, reason, changed },
        },
      });
      return { changed };
    });

    res.status(200).json(ResponseFormatter.success(result, 'Loyalty points adjusted'));
  }

  private async expire(req: Request, res: Response): Promise<void> {
    if (!req.userId) throw new ForbiddenError('Authentication required');
    const result = await this.prisma.$transaction(async (tx) => {
      const expiredPoints = await new LoyaltyMutationService(tx).expireDuePoints();
      await tx.auditLog.create({
        data: {
          actorType: 'ADMIN',
          actorId: req.userId,
          targetType: 'LOYALTY',
          action: 'LOYALTY_EXPIRE_DUE_POINTS',
          newData: { expiredPoints },
        },
      });
      return { expiredPoints };
    });
    res.status(200).json(ResponseFormatter.success(result, 'Loyalty expiration processed'));
  }
}
