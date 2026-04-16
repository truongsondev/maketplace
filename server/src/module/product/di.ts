import { Router } from 'express';
import { prisma } from '../../infrastructure/database';

import { PrismaCategoryRepository } from './infrastructure/repositories/prisma-category.repository';
import { PrismaProductRepository } from './infrastructure/repositories/prisma-product.repository';
import { PrismaWishlistRepository } from './infrastructure/repositories/prisma-wishlist.repository';
import { GetCategoryStatsUseCase } from './applications/usecases/get-category-stats.usecase';
import { GetCategoryShowcasesUseCase } from './applications/usecases/get-category-showcases.usecase';
import { GetProductsUseCase } from './applications/usecases/get-products.usecase';
import { GetProductDetailUseCase } from './applications/usecases/get-product-detail.usecase';
import { AddProductFavoriteUseCase } from './applications/usecases/add-product-favorite.usecase';
import { RemoveProductFavoriteUseCase } from './applications/usecases/remove-product-favorite.usecase';
import { GetFavoriteProductsUseCase } from './applications/usecases/get-favorite-products.usecase';
import { GetRelatedProductsFromOrdersUseCase } from './applications/usecases/get-related-products-from-orders.usecase';
import { ProductController } from './interface-adapter/controller/product.controller';
import { ProductAPI } from './infrastructure/api/product.api';

export function createProductModule(): Router {
  const categoryRepository = new PrismaCategoryRepository(prisma);
  const productRepository = new PrismaProductRepository(prisma);
  const wishlistRepository = new PrismaWishlistRepository(prisma);

  const getCategoryStatsUseCase = new GetCategoryStatsUseCase(categoryRepository);
  const getCategoryShowcasesUseCase = new GetCategoryShowcasesUseCase(productRepository);
  const getProductsUseCase = new GetProductsUseCase(productRepository);
  const getProductDetailUseCase = new GetProductDetailUseCase(productRepository);
  const addProductFavoriteUseCase = new AddProductFavoriteUseCase(wishlistRepository);
  const removeProductFavoriteUseCase = new RemoveProductFavoriteUseCase(wishlistRepository);
  const getFavoriteProductsUseCase = new GetFavoriteProductsUseCase(wishlistRepository);
  const getRelatedProductsFromOrdersUseCase = new GetRelatedProductsFromOrdersUseCase(prisma);

  const controller = new ProductController(
    getCategoryStatsUseCase,
    getCategoryShowcasesUseCase,
    getProductsUseCase,
    getProductDetailUseCase,
    addProductFavoriteUseCase,
    removeProductFavoriteUseCase,
    getFavoriteProductsUseCase,
    getRelatedProductsFromOrdersUseCase,
  );

  const productAPI = new ProductAPI(controller);
  return productAPI.router;
}

export const ProductConnect = createProductModule;
