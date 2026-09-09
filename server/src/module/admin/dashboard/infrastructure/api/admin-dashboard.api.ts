import express, { Request, Response } from 'express';
import { asyncHandler } from '../../../../../shared/server/error-middleware';
import { ResponseFormatter } from '../../../../../shared/server/api-response';
import { BadRequestError } from '../../../../../error-handlling/badRequestError';
import { AdminDashboardController } from '../../interface-adapter/controller/admin-dashboard.controller';

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

function parseRangeQuery(
  query: Request['query'],
  options: { defaultDays: number; maxDays: number },
): { from?: Date; to?: Date; days: number } {
  const fromInput = parseDateInput(query.from, 'from');
  const toInput = parseDateInput(query.to, 'to');

  if (fromInput || toInput) {
    if (!fromInput || !toInput) {
      throw new BadRequestError('from and to are required when filtering by date range');
    }

    const from = fromInput.isDateOnly ? startOfDay(fromInput.date) : fromInput.date;
    let to = toInput.isDateOnly ? startOfDay(toInput.date) : toInput.date;
    if (toInput.isDateOnly) {
      to = addDays(to, 1);
    }

    if (from >= to) {
      throw new BadRequestError('from must be before to');
    }

    const days = Math.ceil((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000));
    if (days > options.maxDays) {
      throw new BadRequestError(`range must be <= ${options.maxDays} days`);
    }

    return { from, to, days };
  }

  const days = parsePositiveInt(query.days, options.defaultDays);
  if (days > options.maxDays) {
    throw new BadRequestError(`days must be <= ${options.maxDays}`);
  }

  return { days };
}

export class AdminDashboardAPI {
  readonly router = express.Router();

  constructor(private readonly controller: AdminDashboardController) {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get('/overview', asyncHandler(this.overview.bind(this)));
    this.router.get('/timeseries', asyncHandler(this.timeseries.bind(this)));
    this.router.get('/recent-orders', asyncHandler(this.recentOrders.bind(this)));
  }

  private async overview(_req: Request, res: Response): Promise<void> {
    const range = parseRangeQuery(_req.query, { defaultDays: 30, maxDays: 365 });
    const result = await this.controller.getOverview(range);
    res
      .status(200)
      .json(ResponseFormatter.success(result, 'Dashboard overview fetched successfully'));
  }

  private async timeseries(req: Request, res: Response): Promise<void> {
    const range = parseRangeQuery(req.query, { defaultDays: 30, maxDays: 90 });
    const result = await this.controller.getTimeseries(range);
    res
      .status(200)
      .json(ResponseFormatter.success(result, 'Dashboard timeseries fetched successfully'));
  }

  private async recentOrders(req: Request, res: Response): Promise<void> {
    const limit = parsePositiveInt(req.query.limit, 5);
    const range = parseRangeQuery(req.query, { defaultDays: 30, maxDays: 365 });
    const result = await this.controller.listRecentOrders({
      limit,
      from: range.from,
      to: range.to,
    });
    res
      .status(200)
      .json(ResponseFormatter.success({ items: result }, 'Recent orders fetched successfully'));
  }
}
