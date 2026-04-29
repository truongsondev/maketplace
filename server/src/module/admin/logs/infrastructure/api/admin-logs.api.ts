import express, { Request, Response } from 'express';
import type { ActorType } from '@/generated/prisma/enums';
import { ResponseFormatter } from '../../../../../shared/server/api-response';
import { asyncHandler } from '../../../../../shared/server/error-middleware';
import { BadRequestError } from '../../../../../error-handlling/badRequestError';
import { AdminLogsController } from '../../interface-adapter/controller/admin-logs.controller';

function parseActorType(value: unknown): ActorType | undefined {
  if (value === 'ADMIN' || value === 'USER' || value === 'SYSTEM') {
    return value;
  }
  return undefined;
}

function parseDate(value: unknown, fieldName: string): Date | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string') {
    throw new BadRequestError(`${fieldName} must be an ISO date string`);
  }

  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const dateValue = isDateOnly ? `${value}T00:00:00` : value;
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) {
    throw new BadRequestError(`${fieldName} is not a valid date`);
  }
  if (isDateOnly) {
    if (fieldName === 'to') {
      d.setHours(23, 59, 59, 999);
    } else {
      d.setHours(0, 0, 0, 0);
    }
  }
  return d;
}

export class AdminLogsAPI {
  readonly router = express.Router();

  constructor(private readonly controller: AdminLogsController) {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get('/', asyncHandler(this.list.bind(this)));
  }

  private async list(req: Request, res: Response): Promise<void> {
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 20;

    const actorType = req.query.actorType ? parseActorType(req.query.actorType) : undefined;

    const result = await this.controller.list({
      page,
      limit,
      actorType,
      actorId: typeof req.query.actorId === 'string' ? req.query.actorId : undefined,
      action: typeof req.query.action === 'string' ? req.query.action : undefined,
      targetType: typeof req.query.targetType === 'string' ? req.query.targetType : undefined,
      targetId: typeof req.query.targetId === 'string' ? req.query.targetId : undefined,
      from: parseDate(req.query.from, 'from'),
      to: parseDate(req.query.to, 'to'),
    });

    res.status(200).json(ResponseFormatter.success(result));
  }
}
