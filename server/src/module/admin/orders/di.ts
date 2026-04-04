import { Router } from 'express';
import { prisma } from '../../../infrastructure/database';
import { AdminOrdersAPI } from './infrastructure/api/admin-orders.api';

export function createAdminOrdersModule(): Router {
  const api = new AdminOrdersAPI(prisma);
  return api.router;
}

export const AdminOrdersConnect = createAdminOrdersModule;
