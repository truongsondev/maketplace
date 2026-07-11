import express, { Request, Response } from 'express';
import { BadRequestError } from '../../error-handlling/badRequestError';
import { ResponseFormatter } from '../../shared/server/api-response';
import { asyncHandler } from '../../shared/server/error-middleware';
import { PrismaBodyProfileRepository } from './prisma-body-profile.repository';
import { validateBodyProfileInput } from './body-profile.validator';

export class BodyProfileAPI {
  readonly router = express.Router();

  constructor(private readonly repository: PrismaBodyProfileRepository) {
    this.router.get('/me', asyncHandler(this.getAccount.bind(this)));
    this.router.get('/me/body-profile', asyncHandler(this.getMine.bind(this)));
    this.router.put('/me/body-profile', asyncHandler(this.updateMine.bind(this)));
  }

  private getUserId(req: Request): string {
    if (!req.userId) {
      throw new BadRequestError('Vui lòng đăng nhập để cập nhật thông tin vóc dáng.');
    }
    return req.userId;
  }

  private async getMine(req: Request, res: Response): Promise<void> {
    const result = await this.repository.getByUserId(this.getUserId(req));
    res.status(200).json(ResponseFormatter.success(result));
  }

  private async getAccount(req: Request, res: Response): Promise<void> {
    const user = (req as any).user as
      | { id?: string; email?: string | null; status?: string | null }
      | undefined;
    const userId = this.getUserId(req);

    res.status(200).json(
      ResponseFormatter.success({
        id: user?.id ?? userId,
        email: user?.email ?? null,
        status: user?.status ?? null,
      }),
    );
  }

  private async updateMine(req: Request, res: Response): Promise<void> {
    const data = validateBodyProfileInput(req.body ?? {});
    const result = await this.repository.update({
      userId: this.getUserId(req),
      ...data,
    });
    res.status(200).json(ResponseFormatter.success(result, 'Đã lưu thông tin vóc dáng.'));
  }
}
