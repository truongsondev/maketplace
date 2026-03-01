import { Router } from 'express';
import { prisma } from '../../infrastructure/database';

import { CreateProductUseCase } from './applications/usecases/create-product.usecase';
import { PrismaProductRepository } from './infrastructure/repositories/prisma-product.repository';
import { ProductController } from './interface-adapter/controller/product.controller';
import { ProductAPI } from './infrastructure/api/product.api';

export function createAdminModule(): Router {
  // Repositories
  const productRepository = new PrismaProductRepository(prisma);

  // Use Cases
  const createProductUseCase = new CreateProductUseCase(productRepository);

  // Controllers
  const productController = new ProductController(createProductUseCase);

  // API
  const productAPI = new ProductAPI(productController);

  return productAPI.router;
}

export const AdminConnect = createAdminModule;
