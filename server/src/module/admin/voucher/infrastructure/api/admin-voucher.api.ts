import express, { Request, Response } from 'express';
import { asyncHandler } from '../../../../../shared/server/error-middleware';
import { ResponseFormatter } from '../../../../../shared/server/api-response';
import { BadRequestError } from '../../../../../error-handlling/badRequestError';
import { AdminVoucherController } from '../../interface-adapter/controller/admin-voucher.controller';
import type { AdminVoucherInput } from '../../applications/dto/admin-voucher.dto';

function parsePositiveInt(value: unknown, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

function parseOptionalBoolean(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (value === true || value === 'true' || value === '1') return true;
  if (value === false || value === 'false' || value === '0') return false;
  throw new BadRequestError('isActive must be a boolean');
}

export class AdminVoucherAPI {
  readonly router = express.Router();

  constructor(private readonly voucherController: AdminVoucherController) {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get('/', asyncHandler(this.list.bind(this)));
    this.router.get('/:id', asyncHandler(this.getById.bind(this)));
    this.router.post('/', asyncHandler(this.create.bind(this)));
    this.router.put('/:id', asyncHandler(this.update.bind(this)));
    this.router.patch('/:id/status', asyncHandler(this.updateStatus.bind(this)));
  }

  private async list(req: Request, res: Response): Promise<void> {
    const page = parsePositiveInt(req.query.page, 1);
    const limit = Math.min(parsePositiveInt(req.query.limit, 20), 100);
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : undefined;
    const isActive = parseOptionalBoolean(req.query.isActive);

    const result = await this.voucherController.listAdminVouchers({
      page,
      limit,
      search,
      isActive,
    });

    res.status(200).json(
      ResponseFormatter.success(
        {
          items: result.items,
          pagination: {
            page,
            limit,
            total: result.total,
            totalPages: Math.ceil(result.total / limit),
          },
        },
        'Vouchers fetched successfully',
      ),
    );
  }

  private async getById(req: Request, res: Response): Promise<void> {
    const id = String(req.params.id || '');
    if (!id) {
      throw new BadRequestError('id is required');
    }

    const voucher = await this.voucherController.getVoucherById(id);
    res.status(200).json(ResponseFormatter.success(voucher, 'Voucher fetched successfully'));
  }

  private async create(req: Request, res: Response): Promise<void> {
    const created = await this.voucherController.createVoucher(req.body as AdminVoucherInput);
    res.status(201).json(ResponseFormatter.success(created, 'Voucher created successfully'));
  }

  private async update(req: Request, res: Response): Promise<void> {
    const id = String(req.params.id || '');
    if (!id) {
      throw new BadRequestError('id is required');
    }

    const updated = await this.voucherController.updateVoucher(id, req.body as AdminVoucherInput);
    res.status(200).json(ResponseFormatter.success(updated, 'Voucher updated successfully'));
  }

  private async updateStatus(req: Request, res: Response): Promise<void> {
    const id = String(req.params.id || '');
    if (!id) {
      throw new BadRequestError('id is required');
    }

    const isActive = (req.body as any)?.isActive;
    if (typeof isActive !== 'boolean') {
      throw new BadRequestError('isActive must be a boolean');
    }

    const updated = await this.voucherController.setVoucherStatus(id, isActive);
    res.status(200).json(ResponseFormatter.success(updated, 'Voucher status updated successfully'));
  }
}
