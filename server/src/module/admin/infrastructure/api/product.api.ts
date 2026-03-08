import express, { Request, Response, NextFunction } from 'express';
import { ResponseFormatter } from '../../../../shared/server/api-response';
import { HttpErrorHandler } from '../../../../shared/server/http-error-handler';
import { BadRequestError } from '../../../../error-handlling/badRequestError';
import { asyncHandler } from '../../../../shared/server/error-middleware';
import { ProductController } from '../../interface-adapter/controller/product.controller';
import { CreateProductCommand } from '../../applications/dto';

export class ProductAPI {
  readonly router = express.Router();

  constructor(private readonly productController: ProductController) {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post('/products', asyncHandler(this.createProduct.bind(this)));
  }

  private validateCreateProductInput(body: any): void {
    const { name, basePrice, variants } = body;

    HttpErrorHandler.validateRequired(
      { name, basePrice, variants },
      'name',
      'basePrice',
      'variants',
    );

    if (typeof name !== 'string' || name.trim().length === 0) {
      throw new BadRequestError('Product name must be a non-empty string');
    }

    if (typeof basePrice !== 'number' || basePrice < 0) {
      throw new BadRequestError('Base price must be a non-negative number');
    }

    if (!Array.isArray(variants) || variants.length === 0) {
      throw new BadRequestError('At least one product variant is required');
    }

    // Validate each variant
    variants.forEach((variant: any, index: number) => {
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
  }

  private async createProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    this.validateCreateProductInput(req.body);

    const command: CreateProductCommand = {
      name: req.body.name,
      description: req.body.description,
      basePrice: req.body.basePrice,
      variants: req.body.variants,
      images: req.body.images,
      categoryIds: req.body.categoryIds,
      tagIds: req.body.tagIds,
    };

    const result = await this.productController.createProduct(command);
    const response = ResponseFormatter.success(result, result.message);
    res.status(201).json(response);
  }
}
