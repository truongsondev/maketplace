import express, { Request, Response, NextFunction } from 'express';
import { ResponseFormatter } from '../../../../shared/server/api-response';
import { asyncHandler } from '../../../../shared/server/error-middleware';
import { ProductController } from '../../interface-adapter/controller/product.controller';
import { BadRequestError } from '../../../../error-handlling/badRequestError';

export class ProductAPI {
  readonly router = express.Router();

  constructor(private readonly productController: ProductController) {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get('/', asyncHandler(this.getProducts.bind(this)));
    this.router.get('/categories/stats', asyncHandler(this.getCategoryStats.bind(this)));
    this.router.get('/favorites', asyncHandler(this.getFavoriteProducts.bind(this)));
    this.router.post('/:id/favorite', asyncHandler(this.addProductToFavorite.bind(this)));
    this.router.delete('/:id/favorite', asyncHandler(this.removeProductFromFavorite.bind(this)));
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

  private async addProductToFavorite(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const userId = req.userId;
    if (!userId) {
      throw new BadRequestError('User ID not found');
    }

    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id || typeof id !== 'string') {
      throw new BadRequestError('product id is required');
    }

    const result = await this.productController.addProductToFavorite(userId, id);
    const response = ResponseFormatter.success(result, 'Product added to favorites successfully');
    res.status(200).json(response);
  }

  private async removeProductFromFavorite(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const userId = req.userId;
    if (!userId) {
      throw new BadRequestError('User ID not found');
    }

    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id || typeof id !== 'string') {
      throw new BadRequestError('product id is required');
    }

    const result = await this.productController.removeProductFromFavorite(userId, id);
    const response = ResponseFormatter.success(result, 'Product removed from favorites successfully');
    res.status(200).json(response);
  }

  private async getFavoriteProducts(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const userId = req.userId;
    if (!userId) {
      throw new BadRequestError('User ID not found');
    }

    const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

    if (page !== undefined && (!Number.isInteger(page) || page <= 0)) {
      throw new BadRequestError('page must be a positive integer');
    }

    if (limit !== undefined && (!Number.isInteger(limit) || limit <= 0)) {
      throw new BadRequestError('limit must be a positive integer');
    }

    const result = await this.productController.getFavoriteProducts(userId, { page, limit });
    const response = ResponseFormatter.success(result, 'Favorite products retrieved successfully');
    res.status(200).json(response);
  }
}
