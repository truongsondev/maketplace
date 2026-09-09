import { Router } from 'express';
import { prisma } from '../../infrastructure/database';
import { OrdersAPI } from './infrastructure/api/orders.api';
import { PrismaOrderReturnRepository } from './infrastructure/repositories/prisma-order-return.repository';
import {
  CancelMyOrderUseCase,
  ConfirmReceivedUseCase,
  GetMyOrderCountsUseCase,
  GetMyOrderDetailUseCase,
  ListMyOrdersUseCase,
  RequestPaidCancelUseCase,
  RequestReturnUseCase,
} from './applications/use-cases';
import { OrderReturnsController } from './interface-adapter/controller/order-returns.controller';
import { OrdersController } from './interface-adapter/controller/orders.controller';
import { PrismaOrderRepository } from './infrastructure/repositories/prisma-order.repository';

export function createOrderModule(): Router {
  const orderRepository = new PrismaOrderRepository(prisma);
  const orderReturnRepository = new PrismaOrderReturnRepository(prisma);

  const listMyOrdersUseCase = new ListMyOrdersUseCase(orderRepository);
  const getMyOrderCountsUseCase = new GetMyOrderCountsUseCase(orderRepository);
  const getMyOrderDetailUseCase = new GetMyOrderDetailUseCase(orderRepository);
  const cancelMyOrderUseCase = new CancelMyOrderUseCase(orderRepository);
  const requestPaidCancelUseCase = new RequestPaidCancelUseCase(orderRepository);
  const confirmReceivedUseCase = new ConfirmReceivedUseCase(orderRepository);

  const requestReturnUseCase = new RequestReturnUseCase(orderReturnRepository);
  const orderReturnsController = new OrderReturnsController(requestReturnUseCase);

  const ordersController = new OrdersController(
    listMyOrdersUseCase,
    getMyOrderCountsUseCase,
    getMyOrderDetailUseCase,
    cancelMyOrderUseCase,
    requestPaidCancelUseCase,
    confirmReceivedUseCase,
  );

  const api = new OrdersAPI(ordersController, orderReturnsController);
  return api.router;
}

export const OrderConnect = createOrderModule;
