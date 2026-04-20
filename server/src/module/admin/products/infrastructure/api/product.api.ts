import express, { Request, Response, NextFunction } from 'express';
import { ResponseFormatter } from '../../../../../shared/server/api-response';
import { HttpErrorHandler } from '../../../../../shared/server/http-error-handler';
import { BadRequestError } from '../../../../../error-handlling/badRequestError';
import { asyncHandler } from '../../../../../shared/server/error-middleware';
import { ProductController } from '../../interface-adapter/controller/product.controller';
import { CreateProductCommand } from '../../applications/dto';

export class ProductAPI {
  readonly router = express.Router();
  private readonly removedProductAttributeCodes = new Set([
    'seo_title',
    'seo_description',
    'seo_keywords',
  ]);

  constructor(private readonly productController: ProductController) {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // List & Detail
    this.router.get('/products', asyncHandler(this.getProductsList.bind(this)));
    this.router.get('/products/export', asyncHandler(this.exportProducts.bind(this)));
    this.router.get('/products/:id', asyncHandler(this.getProductDetail.bind(this)));

    // CRUD
    this.router.post('/products', asyncHandler(this.createProduct.bind(this)));
    this.router.put('/products/:id', asyncHandler(this.updateProduct.bind(this)));
    this.router.delete('/products/:id', asyncHandler(this.deleteProduct.bind(this)));

    // Restore
    this.router.post('/products/:id/restore', asyncHandler(this.restoreProduct.bind(this)));

    // Bulk operations
    this.router.post('/products/bulk-delete', asyncHandler(this.bulkDeleteProducts.bind(this)));
  }

  private validateCreateProductInput(body: any): void {
    const { name, basePrice, variants } = body;

    HttpErrorHandler.validateRequired({ name, basePrice }, 'name', 'basePrice');

    if (typeof name !== 'string' || name.trim().length === 0) {
      throw new BadRequestError('Product name must be a non-empty string');
    }

    if (typeof basePrice !== 'number' || basePrice < 0) {
      throw new BadRequestError('Base price must be a non-negative number');
    }

    if (variants !== undefined && !Array.isArray(variants)) {
      throw new BadRequestError('Variants must be an array');
    }

    // Validate each variant
    (Array.isArray(variants) ? variants : []).forEach((variant: any, index: number) => {
      if (!variant.sku || typeof variant.sku !== 'string') {
        throw new BadRequestError(`Variant ${index + 1}: SKU is required and must be a string`);
      }

      if (typeof variant.price !== 'number' || variant.price < 0) {
        throw new BadRequestError(`Variant ${index + 1}: Price must be a non-negative number`);
      }

      if (typeof variant.stockAvailable !== 'number' || variant.stockAvailable < 0) {
        throw new BadRequestError(
          `Variant ${index + 1}: Stock available must be a non-negative number`,
        );
      }

      if (!variant.attributes || typeof variant.attributes !== 'object') {
        throw new BadRequestError(`Variant ${index + 1}: Attributes must be an object`);
      }
    });

    // Validate images if provided
    if (body.images) {
      if (!Array.isArray(body.images)) {
        throw new BadRequestError('Images must be an array');
      }

      body.images.forEach((image: any, index: number) => {
        if (!image.url || typeof image.url !== 'string') {
          throw new BadRequestError(`Image ${index + 1}: URL is required and must be a string`);
        }
      });
    }

    // Validate category IDs if provided
    if (body.categoryIds) {
      if (!Array.isArray(body.categoryIds)) {
        throw new BadRequestError('Category IDs must be an array');
      }
    }

    // Validate tag IDs if provided
    if (body.tagIds) {
      if (!Array.isArray(body.tagIds)) {
        throw new BadRequestError('Tag IDs must be an array');
      }
    }

    if (body.productAttributes !== undefined) {
      if (!Array.isArray(body.productAttributes)) {
        throw new BadRequestError('productAttributes must be an array');
      }

      body.productAttributes.forEach((attr: any, index: number) => {
        if (!attr || typeof attr !== 'object') {
          throw new BadRequestError(
            `productAttributes[${index}] must be an object with code and value`,
          );
        }

        if (!attr.code || typeof attr.code !== 'string') {
          throw new BadRequestError(`productAttributes[${index}].code must be a non-empty string`);
        }
      });
    }
  }

  private sanitizeProductAttributes(productAttributes: unknown): any[] | undefined {
    if (!Array.isArray(productAttributes)) return undefined;

    return productAttributes.filter((attr) => {
      const code = typeof attr?.code === 'string' ? attr.code.trim() : '';
      if (!code) return false;
      return !this.removedProductAttributeCodes.has(code);
    });
  }

  private async createProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    this.validateCreateProductInput(req.body);

    const command: CreateProductCommand = {
      name: req.body.name,
      basePrice: req.body.basePrice,
      variants: Array.isArray(req.body.variants) ? req.body.variants : [],
      images: req.body.images,
      categoryIds: req.body.categoryIds,
      tagIds: req.body.tagIds,
      productAttributes: this.sanitizeProductAttributes(req.body.productAttributes),
    };

    const result = await this.productController.createProduct(command);
    const response = ResponseFormatter.success(result, result.message);
    res.status(201).json(response);
  }

  private async getProductsList(req: Request, res: Response, next: NextFunction): Promise<void> {
    const command = {
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      search: req.query.search as string,
      categoryId: req.query.categoryId as string,
      status: req.query.status as 'active' | 'inactive' | 'deleted',
      minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
      maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
      stockStatus: req.query.stockStatus as 'all' | 'low' | 'out',
      tagIds: req.query.tagIds as string,
      sortBy: req.query.sortBy as 'name' | 'basePrice' | 'createdAt' | 'totalStock',
      sortOrder: req.query.sortOrder as 'asc' | 'desc',
    };

    const result = await this.productController.getProductsList(command);
    const response = ResponseFormatter.success(result);
    res.status(200).json(response);
  }

  private async getProductDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
    const productId = req.params.id as string;
    const result = await this.productController.getProductDetail({ productId });
    const response = ResponseFormatter.success(result);
    res.status(200).json(response);
  }

  private async updateProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    const productId = req.params.id;
    const command = {
      productId,
      ...req.body,
      productAttributes: this.sanitizeProductAttributes(req.body.productAttributes),
    };

    const result = await this.productController.updateProduct(command);
    const response = ResponseFormatter.success(result, result.message);
    res.status(200).json(response);
  }

  private async deleteProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    const productId = req.params.id as string;
    const result = await this.productController.deleteProduct({ productId });
    const response = ResponseFormatter.success(result, result.message);
    res.status(200).json(response);
  }

  private async restoreProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    const productId = req.params.id as string;
    const result = await this.productController.restoreProduct({ productId });
    const response = ResponseFormatter.success(result, result.message);
    res.status(200).json(response);
  }

  private async bulkDeleteProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { productIds } = req.body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      throw new BadRequestError('Product IDs must be a non-empty array');
    }

    const result = await this.productController.bulkDeleteProducts({ productIds });
    const response = ResponseFormatter.success(result, result.message);
    res.status(200).json(response);
  }

  private async exportProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    const command = {
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      search: req.query.search as string,
      categoryId: req.query.categoryId as string,
      status: req.query.status as 'active' | 'inactive' | 'deleted',
      minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
      maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
      stockStatus: req.query.stockStatus as 'all' | 'low' | 'out',
      tagIds: req.query.tagIds as string,
      sortBy: req.query.sortBy as 'name' | 'basePrice' | 'createdAt' | 'totalStock',
      sortOrder: req.query.sortOrder as 'asc' | 'desc',
    };

    const result = await this.productController.exportProducts(command);

    // Set CSV headers
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.status(200).send(result.csvContent);
  }
}
