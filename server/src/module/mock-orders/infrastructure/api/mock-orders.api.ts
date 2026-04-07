import express, { Request, Response } from 'express';
import { asyncHandler } from '../../../../shared/server/error-middleware';
import { ResponseFormatter } from '../../../../shared/server/api-response';
import { BadRequestError } from '../../../../error-handlling/badRequestError';
import { HttpErrorHandler } from '../../../../shared/server/http-error-handler';
import type { MockOrdersController } from '../../interface-adapter/controller/mock-orders.controller';

export class MockOrdersAPI {
  readonly router = express.Router();

  constructor(private readonly controller: MockOrdersController) {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post('/:orderId/deliver', asyncHandler(this.markDelivered.bind(this)));
    this.router.post('/:orderId/returns/pickup', asyncHandler(this.markReturnPickedUp.bind(this)));
    this.router.post('/:orderId/returns/complete', asyncHandler(this.completeReturn.bind(this)));
  }

  private parseOrderId(req: Request): string {
    const rawOrderId = (req.params as any).orderId as string | string[] | undefined;
    const orderId = Array.isArray(rawOrderId) ? rawOrderId[0] : rawOrderId;
    HttpErrorHandler.validateRequired({ orderId }, 'orderId');
    if (!orderId) {
      throw new BadRequestError('orderId is required');
    }
    return orderId;
  }

  private async markDelivered(req: Request, res: Response): Promise<void> {
    const orderId = this.parseOrderId(req);
    const result = await this.controller.markDelivered(orderId);
    res.status(200).json(ResponseFormatter.success(result, 'OK'));
  }

  private async markReturnPickedUp(req: Request, res: Response): Promise<void> {
    const orderId = this.parseOrderId(req);
    const result = await this.controller.markReturnPickedUp(orderId);
    res.status(200).json(ResponseFormatter.success(result, 'OK'));
  }

  private async completeReturn(req: Request, res: Response): Promise<void> {
    const orderId = this.parseOrderId(req);
    const result = await this.controller.completeReturn(orderId);
    res.status(200).json(ResponseFormatter.success(result, 'OK'));
  }
}
