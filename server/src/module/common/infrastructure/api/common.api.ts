import express from 'express';
import { asyncHandler } from '../../../../shared/server/error-middleware';
import { CommonController } from '../../interface-adapter/controller/common.controller';
import { PublicProductsController } from '../../interface-adapter/controller/public-products.controller';

export class CommonAPI {
  readonly router = express.Router();

  constructor(
    private readonly commonController: CommonController,
    private readonly publicProductsController: PublicProductsController,
  ) {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Public endpoints - no auth required
    this.router.get(
      '/products',
      asyncHandler(this.publicProductsController.getProducts.bind(this.publicProductsController)),
    );
    this.router.get(
      '/categories',
      asyncHandler(this.commonController.getCategories.bind(this.commonController)),
    );
    this.router.get(
      '/tags',
      asyncHandler(this.commonController.getTags.bind(this.commonController)),
    );

    this.router.get(
      '/product-type-schema',
      asyncHandler(this.commonController.getProductTypeSchema.bind(this.commonController)),
    );
  }
}
