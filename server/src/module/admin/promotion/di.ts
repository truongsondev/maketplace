import { Router } from 'express';
import { prisma } from '../../../infrastructure/database';
import { AdminPromotionAPI } from './infrastructure/api/admin-promotion.api';

export function createAdminPromotionModule(): Router {
  return new AdminPromotionAPI(prisma).router;
}

export const AdminPromotionConnect = createAdminPromotionModule;
