import express, { Request, Response } from 'express';
import { asyncHandler } from '../../../../shared/server/error-middleware';
import { ResponseFormatter } from '../../../../shared/server/api-response';
import { BannerController } from '../../interface-adapter/controller/banner.controller';

export class PublicBannerAPI {
  readonly router = express.Router();

  constructor(private readonly bannerController: BannerController) {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get('/active', asyncHandler(this.getActiveBanners.bind(this)));
  }

  private async getActiveBanners(req: Request, res: Response): Promise<void> {
    const items = await this.bannerController.listActiveBanners();
    res
      .status(200)
      .json(ResponseFormatter.success({ items }, 'Active banners fetched successfully'));
  }
}
