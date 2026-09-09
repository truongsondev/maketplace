import { Router } from 'express';
import { prisma } from '@/infrastructure/database';

import { ReviewAPI } from './infrastructure/api/review.api';
import { PrismaReviewRepository } from './infrastructure/repositories/prisma-review.repository';
import { PrismaOrderItemRepository } from './infrastructure/repositories/prisma-order-item.repository';
import { CloudinaryServiceImpl } from './infrastructure/repositories/cloudinary.service';

import { ReviewController } from './interface-adapter/controller/review.controller';
import { GenerateReviewUploadSignatureUseCase } from './applications/usecases/generate-review-signature.usecase';
import { CreateReviewUseCase } from './applications/usecases/create-review.usecase';
import { GetOrderReviewStatusUseCase } from './applications/usecases/get-order-review-status.usecase';

export function createReviewModule(): Router {
  const reviewRepository = new PrismaReviewRepository(prisma);
  const orderItemRepository = new PrismaOrderItemRepository(prisma);
  const cloudinaryService = new CloudinaryServiceImpl();

  const generateSignatureUseCase = new GenerateReviewUploadSignatureUseCase(cloudinaryService);
  const createReviewUseCase = new CreateReviewUseCase(orderItemRepository, reviewRepository);
  const getOrderReviewStatusUseCase = new GetOrderReviewStatusUseCase(
    orderItemRepository,
    reviewRepository,
  );

  const controller = new ReviewController(
    generateSignatureUseCase,
    createReviewUseCase,
    getOrderReviewStatusUseCase,
  );

  const api = new ReviewAPI(controller);
  return api.router;
}

export const ReviewConnect = createReviewModule;
