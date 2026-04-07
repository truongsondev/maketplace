import { Router } from 'express';
import { prisma } from '../../infrastructure/database';
import { MockOrdersAPI } from '@/module/mock-orders/infrastructure/api/mock-orders.api';
import { PrismaMockOrdersRepository } from '@/module/mock-orders/infrastructure/repositories/prisma-mock-orders.repository';
import { MarkDeliveredUseCase } from '@/module/mock-orders/applications/use-cases/mark-delivered.usecase';
import { MarkReturnPickedUpUseCase } from '@/module/mock-orders/applications/use-cases/mark-return-picked-up.usecase';
import { CompleteReturnUseCase } from '@/module/mock-orders/applications/use-cases/complete-return.usecase';
import { MockOrdersController } from '@/module/mock-orders/interface-adapter/controller/mock-orders.controller';

export function createMockOrdersModule(): Router {
  const repo = new PrismaMockOrdersRepository(prisma);
  const controller = new MockOrdersController(
    new MarkDeliveredUseCase(repo),
    new MarkReturnPickedUpUseCase(repo),
    new CompleteReturnUseCase(repo),
  );

  const api = new MockOrdersAPI(controller);
  return api.router;
}

export const MockOrdersConnect = createMockOrdersModule;
