import express, { Request, Response } from 'express';
import { BadRequestError } from '../../error-handlling/badRequestError';
import { ResponseFormatter } from '../../shared/server/api-response';
import { asyncHandler } from '../../shared/server/error-middleware';
import { parseCreateVirtualTryOnBody } from './virtual-try-on.validator';
import { VirtualTryOnService } from './virtual-try-on.service';
import type { VirtualTryOnStatus } from './virtual-try-on.types';

function requireUserId(req: Request): string {
  if (!req.userId) {
    throw new BadRequestError('Vui lòng đăng nhập để sử dụng thử đồ AI.', 'UNAUTHORIZED');
  }
  return req.userId;
}

function parsePage(req: Request): { page: number; limit: number } {
  const page = Math.max(1, Number.parseInt(String(req.query.page ?? '1'), 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(String(req.query.limit ?? '12'), 10) || 12));
  return { page, limit };
}

function routeParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] : (value ?? '');
}

export class VirtualTryOnAPI {
  readonly router = express.Router();

  constructor(private readonly service: VirtualTryOnService) {
    this.router.post('/cloudinary/sign', asyncHandler(this.signUpload.bind(this)));
    this.router.post('/', asyncHandler(this.create.bind(this)));
    this.router.get('/history', asyncHandler(this.history.bind(this)));
    this.router.get('/:id', asyncHandler(this.get.bind(this)));
    this.router.delete('/:id', asyncHandler(this.delete.bind(this)));
  }

  private async signUpload(req: Request, res: Response): Promise<void> {
    const result = this.service.generateUploadSignature(requireUserId(req));
    res.status(200).json(ResponseFormatter.success(result, 'Upload signature generated'));
  }

  private async create(req: Request, res: Response): Promise<void> {
    const input = parseCreateVirtualTryOnBody(req.body);
    const result = await this.service.create({
      ...input,
      userId: requireUserId(req),
    });
    res.status(201).json(ResponseFormatter.success(result, 'Đã tạo yêu cầu thử đồ AI.'));
  }

  private async get(req: Request, res: Response): Promise<void> {
    const result = await this.service.getOwned(routeParam(req.params.id), requireUserId(req));
    res.status(200).json(ResponseFormatter.success(result));
  }

  private async history(req: Request, res: Response): Promise<void> {
    const { page, limit } = parsePage(req);
    const [total, items] = await this.service.listMine(requireUserId(req), page, limit);
    res.status(200).json(ResponseFormatter.paginated(items, total, page, limit));
  }

  private async delete(req: Request, res: Response): Promise<void> {
    await this.service.deleteMine(routeParam(req.params.id), requireUserId(req));
    res.status(200).json(ResponseFormatter.success({ deleted: true }, 'Đã xóa khỏi lịch sử.'));
  }
}

export class AdminVirtualTryOnAPI {
  readonly router = express.Router();

  constructor(private readonly service: VirtualTryOnService) {
    this.router.get('/', asyncHandler(this.list.bind(this)));
    this.router.get('/analytics', asyncHandler(this.analytics.bind(this)));
  }

  private async list(req: Request, res: Response): Promise<void> {
    const { page, limit } = parsePage(req);
    const status =
      typeof req.query.status === 'string' && req.query.status
        ? (req.query.status as VirtualTryOnStatus)
        : undefined;
    const [total, items] = await this.service.listAdmin(status, page, limit);
    res.status(200).json(ResponseFormatter.paginated(items, total, page, limit));
  }

  private async analytics(req: Request, res: Response): Promise<void> {
    const result = await this.service.analytics();
    res.status(200).json(ResponseFormatter.success(result));
  }
}
