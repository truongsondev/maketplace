import express, { Request, Response, NextFunction } from 'express';
import { ResponseFormatter } from '../../../../../shared/server/api-response';
import { asyncHandler } from '../../../../../shared/server/error-middleware';
import { InventoryController } from '../../interface-adapter/controller/inventory.controller';

export class InventoryAPI {
  readonly router = express.Router();

  constructor(private readonly inventoryController: InventoryController) {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get('/inventory/logs', asyncHandler(this.getInventoryLogs.bind(this)));
  }

  private async getInventoryLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    const command = {
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      variantId: req.query.variantId as string,
      productId: req.query.productId as string,
      action: req.query.action as 'IMPORT' | 'EXPORT' | 'RETURN' | 'ADJUSTMENT',
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
    };

    const result = await this.inventoryController.getInventoryLogs(command);
    const response = ResponseFormatter.success(result);
    res.status(200).json(response);
  }
}
