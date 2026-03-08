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
    this.router.get('/:id', asyncHandler(this.getProductDetail.bind(this)));
  }

  private async getProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

    // Handle query parameters that can be string | string[] | ParsedQs
    const getStringParam = (param: any): string | undefined => {
      if (typeof param === 'string') return param;
      if (Array.isArray(param) && param.length > 0) return param[0];
      return undefined;
    };

    const category = getStringParam(req.query.c);
    const size = getStringParam(req.query.s);
    const color = getStringParam(req.query.cl);
    const priceRange = getStringParam(req.query.p);

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

  private async getProductDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const result = await this.productController.getProductDetail({ id });
    const response = ResponseFormatter.success(result, 'Product detail retrieved successfully');
    res.status(200).json(response);
  }
}
