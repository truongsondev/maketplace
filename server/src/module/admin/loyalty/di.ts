import { Router } from 'express';
import { prisma } from '../../../infrastructure/database';
import { AdminLoyaltyAPI } from './infrastructure/api/admin-loyalty.api';

export function createAdminLoyaltyModule(): Router {
  return new AdminLoyaltyAPI(prisma).router;
}

export const AdminLoyaltyConnect = createAdminLoyaltyModule;
