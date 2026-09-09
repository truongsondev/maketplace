import express, { Request, Response } from 'express';
import { asyncHandler } from '../../../../../shared/server/error-middleware';
import { ResponseFormatter } from '../../../../../shared/server/api-response';
import { BadRequestError } from '../../../../../error-handlling/badRequestError';
import { AdminBannerController } from '../../interface-adapter/controller/admin-banner.controller';
import type { AdminBannerInput } from '../../applications/dto/admin-banner.dto';

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

export class AdminBannerAPI {
  readonly router = express.Router();

  constructor(private readonly bannerController: AdminBannerController) {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get('/', asyncHandler(this.list.bind(this)));
    this.router.get('/:id', asyncHandler(this.getById.bind(this)));
    this.router.post('/', asyncHandler(this.create.bind(this)));
    this.router.put('/:id', asyncHandler(this.update.bind(this)));
    this.router.patch('/:id/status', asyncHandler(this.updateStatus.bind(this)));
    this.router.post('/cloudinary/sign', asyncHandler(this.generateUploadSignature.bind(this)));
  }

  private async list(req: Request, res: Response): Promise<void> {
    const page = parsePositiveInt(req.query.page, 1);
    const limit = Math.min(parsePositiveInt(req.query.limit, 20), 100);
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : undefined;
    const isActive = parseOptionalBoolean(req.query.isActive);

    const result = await this.bannerController.listAdminBanners({
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
        'Banners fetched successfully',
      ),
    );
  }

  private async getById(req: Request, res: Response): Promise<void> {
    const id = String(req.params.id || '');
    if (!id) {
      throw new BadRequestError('id is required');
    }

    const banner = await this.bannerController.getBannerById(id);
    res.status(200).json(ResponseFormatter.success(banner, 'Banner fetched successfully'));
  }

  private async create(req: Request, res: Response): Promise<void> {
    const created = await this.bannerController.createBanner(req.body as AdminBannerInput);
    res.status(201).json(ResponseFormatter.success(created, 'Banner created successfully'));
  }

  private async update(req: Request, res: Response): Promise<void> {
    const id = String(req.params.id || '');
    if (!id) {
      throw new BadRequestError('id is required');
    }

    const updated = await this.bannerController.updateBanner(id, req.body as AdminBannerInput);
    res.status(200).json(ResponseFormatter.success(updated, 'Banner updated successfully'));
  }

  private async updateStatus(req: Request, res: Response): Promise<void> {
    const id = String(req.params.id || '');
    if (!id) {
      throw new BadRequestError('id is required');
    }

    const isActive = (req.body as { isActive?: unknown }).isActive;
    if (typeof isActive !== 'boolean') {
      throw new BadRequestError('isActive must be a boolean');
    }

    const updated = await this.bannerController.setBannerStatus(id, isActive);
    res.status(200).json(ResponseFormatter.success(updated, 'Banner status updated successfully'));
  }

  private async generateUploadSignature(req: Request, res: Response): Promise<void> {
    const folder = (req.body as { folder?: unknown }).folder;
    if (folder !== undefined && typeof folder !== 'string') {
      throw new BadRequestError('folder must be a string');
    }

    const result = this.bannerController.generateUploadSignature(folder);
    res.status(200).json(ResponseFormatter.success(result, 'Signature generated successfully'));
  }
}
