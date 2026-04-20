import express, { Request, Response, NextFunction } from 'express';
import { createLogger } from '../../../../shared/util/logger';
import { ResponseFormatter } from '../../../../shared/server/api-response';
import { asyncHandler } from '../../../../shared/server/error-middleware';
import { ProductController } from '../../interface-adapter/controller/product.controller';
import { BadRequestError } from '../../../../error-handlling/badRequestError';
import { redis } from '../../../../infrastructure/database';

export class ProductAPI {
  readonly router = express.Router();
  private readonly logger = createLogger('ProductAPI');
  private readonly homeCacheTtlSeconds = 600;

  constructor(private readonly productController: ProductController) {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get('/', asyncHandler(this.getProducts.bind(this)));
    this.router.get('/categories/stats', asyncHandler(this.getCategoryStats.bind(this)));
    this.router.get('/category-showcases', asyncHandler(this.getCategoryShowcases.bind(this)));
    this.router.get('/home/category-showcases', asyncHandler(this.getCategoryShowcases.bind(this)));
    this.router.get('/home/team-content', asyncHandler(this.getHomeTeamContent.bind(this)));
    this.router.get('/related/my-orders', asyncHandler(this.getRelatedFromMyOrders.bind(this)));
    this.router.get('/favorites', asyncHandler(this.getFavoriteProducts.bind(this)));
    this.router.post('/:id/favorite', asyncHandler(this.addProductToFavorite.bind(this)));
    this.router.delete('/:id/favorite', asyncHandler(this.removeProductFromFavorite.bind(this)));
    this.router.get('/:id', asyncHandler(this.getProductDetail.bind(this)));
  }

  private async getRelatedFromMyOrders(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const userId = req.userId;
    if (!userId) {
      throw new BadRequestError('User ID not found');
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    if (limit !== undefined && (!Number.isFinite(limit) || limit <= 0)) {
      throw new BadRequestError('limit must be a positive integer');
    }

    const result = await this.productController.getRelatedProductsFromMyOrders(userId, limit);
    const response = ResponseFormatter.success(result, 'Related products retrieved successfully');
    res.status(200).json(response);
  }

  private parsePositiveIntegerQueryParam(value: unknown, fieldName: string): number | undefined {
    if (value === undefined) {
      return undefined;
    }

    const raw = Array.isArray(value) ? value[0] : value;
    if (typeof raw !== 'string') {
      throw new BadRequestError(`${fieldName} must be a positive integer`);
    }

    const parsed = Number.parseInt(raw, 10);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new BadRequestError(`${fieldName} must be a positive integer`);
    }

    return parsed;
  }

  private parseNonNegativeIntegerQueryParam(value: unknown, fieldName: string): number | undefined {
    if (value === undefined) {
      return undefined;
    }

    const raw = Array.isArray(value) ? value[0] : value;
    if (typeof raw !== 'string') {
      throw new BadRequestError(`${fieldName} must be a non-negative integer`);
    }

    const parsed = Number.parseInt(raw, 10);
    if (!Number.isInteger(parsed) || parsed < 0) {
      throw new BadRequestError(`${fieldName} must be a non-negative integer`);
    }

    return parsed;
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
    const usageOccasion = getStringParam(req.query.uo) ?? getStringParam(req.query.usageOccasion);
    const priceRange = getStringParam(req.query.p);
    const sort = getStringParam(req.query.sort);
    const search = getStringParam(req.query.q) ?? getStringParam(req.query.search);

    if (search && search.length > 120) {
      throw new BadRequestError('search is too long');
    }

    const result = await this.productController.getProducts({
      page,
      limit,
      category,
      size,
      color,
      usageOccasion,
      priceRange,
      search,
      sort,
    });

    const response = ResponseFormatter.success(result, 'Products retrieved successfully');
    res.status(200).json(response);
  }

  private async getCategoryStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    const nonEmptyOnly = req.query['non_empty_only'] === 'true';
    const cacheKey = `home:categories:stats:${nonEmptyOnly}`;

    const cached = await this.getCache(cacheKey);
    if (cached) {
      res.status(200).json(cached);
      return;
    }

    const result = await this.productController.getCategoryStats({ nonEmptyOnly });
    const response = ResponseFormatter.success(result, 'Category stats retrieved successfully');

    await this.setCache(cacheKey, response);
    res.status(200).json(response);
  }

  private async getCategoryShowcases(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const categoryLimit = this.parsePositiveIntegerQueryParam(
      req.query.categoryLimit,
      'categoryLimit',
    );
    const productLimit = this.parsePositiveIntegerQueryParam(
      req.query.productLimit,
      'productLimit',
    );

    if (categoryLimit !== undefined && categoryLimit > 10) {
      throw new BadRequestError('categoryLimit must be less than or equal to 10');
    }
    if (productLimit !== undefined && productLimit > 20) {
      throw new BadRequestError('productLimit must be less than or equal to 20');
    }

    const cacheKey = `home:category-showcases:v2:${categoryLimit ?? 'default'}:${productLimit ?? 'default'}`;
    const cached = await this.getCache(cacheKey);
    if (cached) {
      res.status(200).json(cached);
      return;
    }

    const result = await this.productController.getCategoryShowcases({
      categoryLimit,
      productLimit,
    });

    const response = ResponseFormatter.success(result, 'Category showcases retrieved successfully');
    await this.setCache(cacheKey, response);
    res.status(200).json(response);
  }

  private async getHomeTeamContent(req: Request, res: Response, next: NextFunction): Promise<void> {
    const cacheKey = 'home:team-content:v1';
    const cached = await this.getCache(cacheKey);
    if (cached) {
      res.status(200).json(cached);
      return;
    }

    const result = await this.productController.getHomeTeamContent();
    const response = ResponseFormatter.success(result, 'Home team content retrieved successfully');

    await this.setCache(cacheKey, response);
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
    const response = ResponseFormatter.success(
      result,
      'Product removed from favorites successfully',
    );
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

    const page = this.parseNonNegativeIntegerQueryParam(req.query.page, 'page');
    const limit = this.parsePositiveIntegerQueryParam(req.query.limit, 'limit');

    if (limit !== undefined && limit > 100) {
      throw new BadRequestError('limit must be less than or equal to 100');
    }

    const result = await this.productController.getFavoriteProducts(userId, { page, limit });
    const response = ResponseFormatter.success(result, 'Favorite products retrieved successfully');
    res.status(200).json(response);
  }

  private async getCache(key: string): Promise<any | null> {
    try {
      const raw = await redis.get(key);
      if (!raw) {
        return null;
      }

      return JSON.parse(raw);
    } catch (error) {
      this.logger.warn('Failed to read cache', { key, error });
      return null;
    }
  }

  private async setCache(key: string, payload: any): Promise<void> {
    try {
      await redis.setex(key, this.homeCacheTtlSeconds, JSON.stringify(payload));
    } catch (error) {
      this.logger.warn('Failed to write cache', { key, error });
    }
  }
}
