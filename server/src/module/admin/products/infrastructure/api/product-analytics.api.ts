import express, { Request, Response } from 'express';
import { asyncHandler } from '../../../../../shared/server/error-middleware';
import { ResponseFormatter } from '../../../../../shared/server/api-response';
import type { AdminProductAnalyticsController } from '../../interface-adapter/controller/admin-product-analytics.controller';

function parsePositiveInt(value: unknown, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.floor(n);
}

export class ProductAnalyticsAPI {
  readonly router = express.Router();

  constructor(private readonly controller: AdminProductAnalyticsController) {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get('/products/analytics/top-selling', asyncHandler(this.getTopSelling.bind(this)));
    this.router.get(
      '/products/analytics/top-favorited',
      asyncHandler(this.getTopFavorited.bind(this)),
    );
    this.router.get(
      '/products/analytics/least-bought',
      asyncHandler(this.getLeastBought.bind(this)),
    );
  }

  private async getTopSelling(req: Request, res: Response): Promise<void> {
    const days = parsePositiveInt(req.query.days, 30);
    const limit = Math.min(parsePositiveInt(req.query.limit, 5), 50);
    const result = await this.controller.getTopSelling({ days, limit });
    res.status(200).json(ResponseFormatter.success(result, 'OK'));
  }

  private async getTopFavorited(req: Request, res: Response): Promise<void> {
    const days = parsePositiveInt(req.query.days, 30);
    const limit = Math.min(parsePositiveInt(req.query.limit, 5), 50);
    const result = await this.controller.getTopFavorited({ days, limit });
    res.status(200).json(ResponseFormatter.success(result, 'OK'));
  }

  private async getLeastBought(req: Request, res: Response): Promise<void> {
    const days = parsePositiveInt(req.query.days, 30);
    const limit = Math.min(parsePositiveInt(req.query.limit, 5), 50);
    const result = await this.controller.getLeastBought({ days, limit });
    res.status(200).json(ResponseFormatter.success(result, 'OK'));
  }
}
