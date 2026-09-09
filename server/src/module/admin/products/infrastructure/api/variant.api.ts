import express, { Request, Response, NextFunction } from 'express';
import { ResponseFormatter } from '../../../../../shared/server/api-response';
import { BadRequestError } from '../../../../../error-handlling/badRequestError';
import { asyncHandler } from '../../../../../shared/server/error-middleware';
import { VariantController } from '../../interface-adapter/controller/variant.controller';

export class VariantAPI {
  readonly router = express.Router();

  constructor(private readonly variantController: VariantController) {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Variant CRUD
    this.router.post('/products/:productId/variants', asyncHandler(this.createVariant.bind(this)));
    this.router.put('/variants/:id', asyncHandler(this.updateVariant.bind(this)));
    this.router.delete('/variants/:id', asyncHandler(this.deleteVariant.bind(this)));

    // Stock management
    this.router.post('/variants/:id/adjust-stock', asyncHandler(this.adjustStock.bind(this)));
  }

  private async createVariant(req: Request, res: Response, next: NextFunction): Promise<void> {
    const productId = req.params.productId;
    const command = {
      productId,
      ...req.body,
    };

    const result = await this.variantController.createVariant(command);
    const response = ResponseFormatter.success(result, result.message);
    res.status(201).json(response);
  }

  private async updateVariant(req: Request, res: Response, next: NextFunction): Promise<void> {
    const variantId = req.params.id;
    const command = {
      variantId,
      ...req.body,
    };

    const result = await this.variantController.updateVariant(command);
    const response = ResponseFormatter.success(result, result.message);
    res.status(200).json(response);
  }

  private async deleteVariant(req: Request, res: Response, next: NextFunction): Promise<void> {
    const variantId = req.params.id as string;
    const result = await this.variantController.deleteVariant({ variantId });
    const response = ResponseFormatter.success(result, result.message);
    res.status(200).json(response);
  }

  private async adjustStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    const variantId = req.params.id as string;
    const { action, quantity, referenceId, note } = req.body;

    if (!action || !['IMPORT', 'EXPORT', 'ADJUSTMENT'].includes(action)) {
      throw new BadRequestError('Valid action is required: IMPORT, EXPORT, or ADJUSTMENT');
    }

    if (typeof quantity !== 'number') {
      throw new BadRequestError('Quantity must be a number');
    }

    const command = {
      variantId,
      action,
      quantity,
      referenceId,
      note,
    };

    const result = await this.variantController.adjustStock(command);
    const response = ResponseFormatter.success(result, result.message);
    res.status(200).json(response);
  }
}
