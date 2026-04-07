import express, { Request, Response } from 'express';
import { asyncHandler } from '../../../../shared/server/error-middleware';
import { ResponseFormatter } from '../../../../shared/server/api-response';
import { VoucherController } from '../../interface-adapter/controller/voucher.controller';

export class PublicVoucherAPI {
  readonly router = express.Router();

  constructor(private readonly voucherController: VoucherController) {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get('/active', asyncHandler(this.getActiveVouchers.bind(this)));
  }

  private async getActiveVouchers(req: Request, res: Response): Promise<void> {
    const items = await this.voucherController.listActiveVouchers();
    res
      .status(200)
      .json(ResponseFormatter.success({ items }, 'Active vouchers fetched successfully'));
  }
}
