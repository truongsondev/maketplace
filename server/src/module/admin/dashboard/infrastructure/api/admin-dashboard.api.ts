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
    const result = await this.controller.getOverview();
    res
      .status(200)
      .json(ResponseFormatter.success(result, 'Dashboard overview fetched successfully'));
  }

  private async timeseries(req: Request, res: Response): Promise<void> {
    const days = parsePositiveInt(req.query.days, 30);
    if (days > 90) {
      throw new BadRequestError('days must be <= 90');
    }

    const result = await this.controller.getTimeseries({ days });
    res
      .status(200)
      .json(ResponseFormatter.success(result, 'Dashboard timeseries fetched successfully'));
  }

  private async recentOrders(req: Request, res: Response): Promise<void> {
    const limit = parsePositiveInt(req.query.limit, 5);
    const result = await this.controller.listRecentOrders({ limit });
    res
      .status(200)
      .json(ResponseFormatter.success({ items: result }, 'Recent orders fetched successfully'));
  }
}
