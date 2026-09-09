import express, { type Request, type Response } from 'express';
import { BadRequestError } from '../../error-handlling/badRequestError';
import { ResponseFormatter } from '../../shared/server/api-response';
import { asyncHandler } from '../../shared/server/error-middleware';
import type { LoyaltyQueryService } from './loyalty.service';

export class LoyaltyAPI {
  readonly router = express.Router();
  constructor(private readonly service: LoyaltyQueryService) {
    this.router.get('/me/loyalty', asyncHandler(this.getMine.bind(this)));
  }
  private async getMine(req: Request, res: Response): Promise<void> {
    if (!req.userId) throw new BadRequestError('Authentication required');
    res.status(200).json(ResponseFormatter.success(await this.service.getMine(req.userId)));
  }
}
