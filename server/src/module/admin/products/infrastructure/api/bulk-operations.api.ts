import express, { Request, Response, NextFunction } from 'express';
import { ResponseFormatter } from '../../../../../shared/server/api-response';
import { BadRequestError } from '../../../../../error-handlling/badRequestError';
import { asyncHandler } from '../../../../../shared/server/error-middleware';
import { BulkOperationsController } from '../../interface-adapter/controller/bulk-operations.controller';

export class BulkOperationsAPI {
  readonly router = express.Router();

  constructor(private readonly bulkOperationsController: BulkOperationsController) {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post(
      '/products/bulk-assign-categories',
      asyncHandler(this.bulkAssignCategories.bind(this)),
    );
    this.router.post('/products/bulk-assign-tags', asyncHandler(this.bulkAssignTags.bind(this)));
  }

  private async bulkAssignCategories(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const { productIds, categoryIds, mode } = req.body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      throw new BadRequestError('Product IDs must be a non-empty array');
    }

    if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
      throw new BadRequestError('Category IDs must be a non-empty array');
    }

    if (!mode || !['append', 'replace'].includes(mode)) {
      throw new BadRequestError('Mode must be either "append" or "replace"');
    }

    const result = await this.bulkOperationsController.bulkAssignCategories({
      productIds,
      categoryIds,
      mode,
    });

    const response = ResponseFormatter.success(result, result.message);
    res.status(200).json(response);
  }

  private async bulkAssignTags(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { productIds, tagIds, mode } = req.body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      throw new BadRequestError('Product IDs must be a non-empty array');
    }

    if (!Array.isArray(tagIds) || tagIds.length === 0) {
      throw new BadRequestError('Tag IDs must be a non-empty array');
    }

    if (!mode || !['append', 'replace'].includes(mode)) {
      throw new BadRequestError('Mode must be either "append" or "replace"');
    }

    const result = await this.bulkOperationsController.bulkAssignTags({
      productIds,
      tagIds,
      mode,
    });

    const response = ResponseFormatter.success(result, result.message);
    res.status(200).json(response);
  }
}
