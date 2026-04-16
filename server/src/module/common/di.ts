import { Router } from 'express';
import { PrismaClient } from '../../../generated/prisma/client';
import { prisma } from '../../infrastructure/database';
import { GetCategoriesUseCase, GetProductTypeSchemaUseCase, GetTagsUseCase } from './applications';
import {
  PrismaCategoryRepository,
  PrismaProductTypeSchemaRepository,
  PrismaTagRepository,
  CommonAPI,
} from './infrastructure';
import { CommonController } from './interface-adapter';

export function createCommonModule(): Router {
  // Initialize repositories
  const categoryRepository = new PrismaCategoryRepository(prisma);
  const tagRepository = new PrismaTagRepository(prisma);
  const productTypeSchemaRepository = new PrismaProductTypeSchemaRepository(prisma);

  // Initialize use cases
  const getCategoriesUseCase = new GetCategoriesUseCase(categoryRepository);
  const getTagsUseCase = new GetTagsUseCase(tagRepository);
  const getProductTypeSchemaUseCase = new GetProductTypeSchemaUseCase(productTypeSchemaRepository);

  // Initialize controller
  const commonController = new CommonController(
    getCategoriesUseCase,
    getTagsUseCase,
    getProductTypeSchemaUseCase,
  );

  // Initialize API
  const commonAPI = new CommonAPI(commonController);

  return commonAPI.router;
}

export const CommonConnect = createCommonModule;
