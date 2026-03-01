import express, { Request, Response, NextFunction } from 'express';
import { ResponseFormatter } from '../../../../shared/server/api-response';
import { asyncHandler } from '../../../../shared/server/error-middleware';
import { ProductController } from '../../interface-adapter/controller/product.controller';

export class ProductAPI {
  readonly router = express.Router();

  constructor(private readonly productController: ProductController) {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get('/', asyncHandler(this.getProducts.bind(this)));
    this.router.get('/categories/stats', asyncHandler(this.getCategoryStats.bind(this)));
  }

  private async getProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    const category = req.query.c as string | undefined;
    const size = req.query.s as string | undefined;
    const color = req.query.cl as string | undefined;
    const priceRange = req.query.p as string | undefined;

    const result = await this.productController.getProducts({
      page,
      limit,
      category,
      size,
      color,
      priceRange,
    });

    const response = ResponseFormatter.success(result, 'Products retrieved successfully');
    res.status(200).json(response);
  }

  private async getCategoryStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    const nonEmptyOnly = req.query['non_empty_only'] === 'true';

    const result = await this.productController.getCategoryStats({ nonEmptyOnly });
    const response = ResponseFormatter.success(result, 'Category stats retrieved successfully');
    res.status(200).json(response);
  }
}
