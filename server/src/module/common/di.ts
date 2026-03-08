import { Router } from 'express';
import { PrismaClient } from '../../../generated/prisma/client';
import { prisma } from '../../infrastructure/database';
import { GetCategoriesUseCase, GetTagsUseCase } from './applications';
import { PrismaCategoryRepository, PrismaTagRepository, CommonAPI } from './infrastructure';
import { CommonController } from './interface-adapter';

export function createCommonModule(): Router {
  // Initialize repositories
  const categoryRepository = new PrismaCategoryRepository(prisma);
  const tagRepository = new PrismaTagRepository(prisma);

  // Initialize use cases
  const getCategoriesUseCase = new GetCategoriesUseCase(categoryRepository);
  const getTagsUseCase = new GetTagsUseCase(tagRepository);

  // Initialize controller
  const commonController = new CommonController(getCategoriesUseCase, getTagsUseCase);

  // Initialize API
  const commonAPI = new CommonAPI(commonController);

  return commonAPI.router;
}

export const CommonConnect = createCommonModule;
