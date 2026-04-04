import { Router } from 'express';
import { prisma } from '../../infrastructure/database';
import { OrdersAPI } from './infrastructure/api/orders.api';

export function createOrderModule(): Router {
  const api = new OrdersAPI(prisma);
  return api.router;
}

export const OrderConnect = createOrderModule;
