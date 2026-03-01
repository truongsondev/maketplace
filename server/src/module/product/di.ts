import { Router } from 'express';
import { prisma } from '../../infrastructure/database';

import { PrismaCategoryRepository } from './infrastructure/repositories/prisma-category.repository';
import { PrismaProductRepository } from './infrastructure/repositories/prisma-product.repository';
import { GetCategoryStatsUseCase } from './applications/usecases/get-category-stats.usecase';
import { GetProductsUseCase } from './applications/usecases/get-products.usecase';
import { ProductController } from './interface-adapter/controller/product.controller';
import { ProductAPI } from './infrastructure/api/product.api';

export function createProductModule(): Router {
  const categoryRepository = new PrismaCategoryRepository(prisma);
  const productRepository = new PrismaProductRepository(prisma);

  const getCategoryStatsUseCase = new GetCategoryStatsUseCase(categoryRepository);
  const getProductsUseCase = new GetProductsUseCase(productRepository);

  const controller = new ProductController(getCategoryStatsUseCase, getProductsUseCase);

  const productAPI = new ProductAPI(controller);
  return productAPI.router;
}

export const ProductConnect = createProductModule;
