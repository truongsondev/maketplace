import { Router } from 'express';
import { prisma } from '../../infrastructure/database';
import { PublicPromotionAPI } from './public-promotion.api';

export function createPublicPromotionModule(): Router {
  return new PublicPromotionAPI(prisma).router;
}
