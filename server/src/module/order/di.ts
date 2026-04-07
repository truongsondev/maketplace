import { Router } from 'express';
import { prisma } from '../../infrastructure/database';
import { OrdersAPI } from './infrastructure/api/orders.api';
import { PrismaOrderReturnRepository } from './infrastructure/repositories/prisma-order-return.repository';
import { RequestReturnUseCase } from './applications/use-cases/request-return.usecase';
import { OrderReturnsController } from './interface-adapter/controller/order-returns.controller';

export function createOrderModule(): Router {
  const orderReturnRepository = new PrismaOrderReturnRepository(prisma);
  const requestReturnUseCase = new RequestReturnUseCase(orderReturnRepository);
  const orderReturnsController = new OrderReturnsController(requestReturnUseCase);

  const api = new OrdersAPI(prisma, orderReturnsController);
  return api.router;
}

export const OrderConnect = createOrderModule;
