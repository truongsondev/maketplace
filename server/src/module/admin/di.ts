import { Router } from 'express';
import { prisma } from '../../infrastructure/database';

import { CreateProductUseCase } from './applications/usecases/create-product.usecase';
import { GenerateSignatureUseCase } from './applications/usecases/generate-signature.usecase';
import { SaveProductImageUseCase } from './applications/usecases/save-product-image.usecase';
import { DeleteProductImageUseCase } from './applications/usecases/delete-product-image.usecase';
import { PrismaProductRepository } from './infrastructure/repositories/prisma-product.repository';
import { PrismaProductImageRepository } from './infrastructure/repositories/prisma-product-image.repository';
import { CloudinaryServiceImpl } from './infrastructure/repositories/cloudinary.service';
import { ProductController } from './interface-adapter/controller/product.controller';
import { UploadController } from './interface-adapter/controller/upload.controller';
import { ProductAPI } from './infrastructure/api/product.api';
import { UploadAPI } from './infrastructure/api/upload.api';

export function createAdminModule(): Router {
  const router = Router();

  const productRepository = new PrismaProductRepository(prisma);
  const productImageRepository = new PrismaProductImageRepository(prisma);
  const cloudinaryService = new CloudinaryServiceImpl();

  const createProductUseCase = new CreateProductUseCase(productRepository);
  const generateSignatureUseCase = new GenerateSignatureUseCase(cloudinaryService);
  const saveProductImageUseCase = new SaveProductImageUseCase(
    productImageRepository,
    productRepository,
  );
  const deleteProductImageUseCase = new DeleteProductImageUseCase(
    productImageRepository,
    cloudinaryService,
  );

  const productController = new ProductController(createProductUseCase);
  const uploadController = new UploadController(
    generateSignatureUseCase,
    saveProductImageUseCase,
    deleteProductImageUseCase,
  );

  const productAPI = new ProductAPI(productController);
  const uploadAPI = new UploadAPI(uploadController);

  router.use(productAPI.router);
  router.use(uploadAPI.router);

  return router;
}

export const AdminConnect = createAdminModule;
