import express, { Request, Response } from 'express';
import type { RefundStatus, RefundType } from '@/generated/prisma/enums';
import { asyncHandler } from '../../../../../shared/server/error-middleware';
import { ResponseFormatter } from '../../../../../shared/server/api-response';
import { BadRequestError } from '../../../../../error-handlling/badRequestError';
import { AdminRefundController } from '../../interface-adapter/controller/admin-refund.controller';

function parsePositiveInt(value: unknown, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
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

function parseRefundStatus(value: unknown): RefundStatus | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const status = String(value).toUpperCase() as RefundStatus;
  if (!['PENDING', 'SUCCESS', 'FAILED', 'RETRYING'].includes(status)) {
    throw new BadRequestError('status must be one of: PENDING, SUCCESS, FAILED, RETRYING');
  }

  return status;
}

function parseRefundType(value: unknown): RefundType | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const type = String(value).toUpperCase() as RefundType;
  if (!['CANCEL_REFUND', 'RETURN_REFUND'].includes(type)) {
    throw new BadRequestError('type must be one of: CANCEL_REFUND, RETURN_REFUND');
  }

  return type;
}

export class AdminRefundAPI {
  readonly router = express.Router();

  constructor(private readonly controller: AdminRefundController) {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get('/', asyncHandler(this.list.bind(this)));
    this.router.get('/:id', asyncHandler(this.getById.bind(this)));
    this.router.post('/:id/retry', asyncHandler(this.retry.bind(this)));
  }

  private async list(req: Request, res: Response): Promise<void> {
    const page = parsePositiveInt(req.query.page, 1);
    const limit = Math.min(parsePositiveInt(req.query.limit, 20), 100);

    const result = await this.controller.listRefunds({
      page,
      limit,
      search: typeof req.query.search === 'string' ? req.query.search.trim() : undefined,
      status: parseRefundStatus(req.query.status),
      type: parseRefundType(req.query.type),
      ...parseDateRangeFilter(req.query),
      sortBy:
        req.query.sortBy === 'processedAt' || req.query.sortBy === 'amount'
          ? req.query.sortBy
          : 'requestedAt',
      sortOrder: req.query.sortOrder === 'asc' ? 'asc' : 'desc',
    });

    res.status(200).json(
      ResponseFormatter.success(
        {
          items: result.items,
          aggregations: result.aggregations,
          pagination: {
            page,
            limit,
            total: result.total,
            totalPages: Math.ceil(result.total / limit),
          },
        },
        'Refunds fetched successfully',
      ),
    );
  }

  private async getById(req: Request, res: Response): Promise<void> {
    const id = String(req.params.id || '');
    if (!id) {
      throw new BadRequestError('id is required');
    }

    const result = await this.controller.getRefundById(id);
    res.status(200).json(ResponseFormatter.success(result, 'Refund fetched successfully'));
  }

  private async retry(req: Request, res: Response): Promise<void> {
    const id = String(req.params.id || '');
    if (!id) {
      throw new BadRequestError('id is required');
    }

    const actorAdminId = req.userId;
    if (!actorAdminId) {
      throw new BadRequestError('User ID not found');
    }

    const result = await this.controller.retryRefund({ refundId: id, actorAdminId });
    res.status(200).json(ResponseFormatter.success(result, 'Refund retried successfully'));
  }
}
