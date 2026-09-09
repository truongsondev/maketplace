import express, { Request, Response } from 'express';
import { asyncHandler } from '@/shared/server/error-middleware';
import { ResponseFormatter } from '@/shared/server/api-response';
import { BadRequestError } from '@/error-handlling/badRequestError';
import type { ReviewController } from '../../interface-adapter/controller/review.controller';
import type {
  CreateReviewCommand,
  GenerateReviewUploadSignatureCommand,
} from '../../applications/dto/review.dto';

export class ReviewAPI {
  readonly router = express.Router();

  constructor(private readonly reviewController: ReviewController) {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post('/cloudinary/sign', asyncHandler(this.generateSignature.bind(this)));
    this.router.get('/orders/:orderId/status', asyncHandler(this.getOrderStatus.bind(this)));
    this.router.post('/', asyncHandler(this.createReview.bind(this)));
  }

  private async generateSignature(req: Request, res: Response): Promise<void> {
    const userId = req.userId;
    if (!userId) {
      throw new BadRequestError('User ID not found');
    }

    const body = req.body as Record<string, unknown>;
    const rawOrderId = body.orderId;
    const orderId =
      typeof rawOrderId === 'string' && rawOrderId.trim() ? rawOrderId.trim() : undefined;

    const command: GenerateReviewUploadSignatureCommand = { userId, orderId };
    const result = this.reviewController.generateUploadSignature(command);

    res.json(ResponseFormatter.success(result, 'Signature generated successfully'));
  }

  private async getOrderStatus(req: Request, res: Response): Promise<void> {
    const userId = req.userId;
    if (!userId) {
      throw new BadRequestError('User ID not found');
    }

    const orderId = Array.isArray(req.params.orderId) ? req.params.orderId[0] : req.params.orderId;
    if (!orderId || typeof orderId !== 'string') {
      throw new BadRequestError('orderId is required');
    }

    const result = await this.reviewController.getOrderReviewStatus({ userId, orderId });
    res.json(ResponseFormatter.success(result, 'Order review status retrieved successfully'));
  }

  private async createReview(req: Request, res: Response): Promise<void> {
    const userId = req.userId;
    if (!userId) {
      throw new BadRequestError('User ID not found');
    }

    const body = req.body as Record<string, unknown>;
    const orderItemId = String(body.orderItemId || '').trim();
    if (!orderItemId) {
      throw new BadRequestError('orderItemId is required');
    }

    const command: CreateReviewCommand = {
      userId,
      orderItemId,
      rating: Number(body.rating),
      comment: typeof body.comment === 'string' ? body.comment : undefined,
      images: Array.isArray(body.images) ? body.images : [],
    };

    const result = await this.reviewController.createReview(command);
    res
      .status(result.alreadyExists ? 200 : 201)
      .json(ResponseFormatter.success(result, result.message));
  }
}
