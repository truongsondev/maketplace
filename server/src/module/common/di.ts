import { Router } from 'express';
import { prisma } from '../../infrastructure/database';
import { GetCategoriesUseCase, GetProductTypeSchemaUseCase, GetTagsUseCase } from './applications';
import {
  PrismaCategoryRepository,
  PrismaProductTypeSchemaRepository,
  PrismaTagRepository,
  CommonAPI,
} from './infrastructure';
import { CommonController } from './interface-adapter';
import { PrismaProductRepository } from '../product/infrastructure/repositories/prisma-product.repository';
import { GetProductsUseCase } from '../product/applications/usecases/get-products.usecase';
import { PublicProductsController } from './interface-adapter/controller/public-products.controller';

export function createCommonModule(): Router {
  // Initialize repositories
  const categoryRepository = new PrismaCategoryRepository(prisma);
  const tagRepository = new PrismaTagRepository(prisma);
  const productTypeSchemaRepository = new PrismaProductTypeSchemaRepository(prisma);
  const productRepository = new PrismaProductRepository(prisma);

  // Initialize use cases
  const getCategoriesUseCase = new GetCategoriesUseCase(categoryRepository);
  const getTagsUseCase = new GetTagsUseCase(tagRepository);
  const getProductTypeSchemaUseCase = new GetProductTypeSchemaUseCase(productTypeSchemaRepository);
  const getProductsUseCase = new GetProductsUseCase(productRepository);

  // Initialize controller
  const commonController = new CommonController(
    getCategoriesUseCase,
    getTagsUseCase,
    getProductTypeSchemaUseCase,
  );

  const publicProductsController = new PublicProductsController(getProductsUseCase);

  // Initialize API
  const commonAPI = new CommonAPI(commonController, publicProductsController);

  return commonAPI.router;
}

export const CommonConnect = createCommonModule;
