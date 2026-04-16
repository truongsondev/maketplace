import express, { Request, Response } from 'express';
import { asyncHandler } from '../../../../shared/server/error-middleware';
import { ResponseFormatter } from '../../../../shared/server/api-response';
import { BadRequestError } from '../../../../error-handlling/badRequestError';
import { VoucherController } from '../../interface-adapter/controller/voucher.controller';

export class VoucherAPI {
  readonly router = express.Router();

  constructor(private readonly voucherController: VoucherController) {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get('/active', asyncHandler(this.getActiveVouchers.bind(this)));
    this.router.post('/validate', asyncHandler(this.validateVoucher.bind(this)));
    this.router.post('/apply', asyncHandler(this.applyVoucher.bind(this)));
  }

  private async getActiveVouchers(req: Request, res: Response): Promise<void> {
    const items = await this.voucherController.listActiveVouchers();
    res
      .status(200)
      .json(ResponseFormatter.success({ items }, 'Active vouchers fetched successfully'));
  }

  private async validateVoucher(req: Request, res: Response): Promise<void> {
    const userId = req.userId;
    if (!userId) {
      throw new BadRequestError('User ID not found');
    }

    const code = String((req.body as any)?.code ?? '').trim();
    const cartItemIdsRaw = (req.body as any)?.cartItemIds;

    if (!code) {
      throw new BadRequestError('code is required');
    }

    const cartItemIds = Array.isArray(cartItemIdsRaw)
      ? cartItemIdsRaw.filter((id) => typeof id === 'string' && id.trim().length > 0)
      : undefined;

    const result = await this.voucherController.validateVoucher({
      userId,
      code,
      cartItemIds,
    });

    res.status(200).json(ResponseFormatter.success(result, 'Voucher validated successfully'));
  }

  private async applyVoucher(req: Request, res: Response): Promise<void> {
    const userId = req.userId;
    if (!userId) {
      throw new BadRequestError('User ID not found');
    }

    const code = String((req.body as any)?.code ?? '').trim();
    const cartItemIdsRaw = (req.body as any)?.cartItemIds;

    if (!code) {
      throw new BadRequestError('code is required');
    }

    const cartItemIds = Array.isArray(cartItemIdsRaw)
      ? cartItemIdsRaw.filter((id) => typeof id === 'string' && id.trim().length > 0)
      : undefined;

    const result = await this.voucherController.validateVoucher({
      userId,
      code,
      cartItemIds,
    });

    res.status(200).json(ResponseFormatter.success(result, 'Voucher applied successfully'));
  }
}
