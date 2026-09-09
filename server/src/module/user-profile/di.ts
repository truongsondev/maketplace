import { Router } from 'express';
import { prisma } from '../../infrastructure/database';
import { BodyProfileAPI } from './body-profile.api';
import { PrismaBodyProfileRepository } from './prisma-body-profile.repository';
import { LoyaltyAPI } from './loyalty.api';
import { LoyaltyQueryService } from './loyalty.service';

export function createUserProfileModule(): Router {
  const repository = new PrismaBodyProfileRepository(prisma);
  const router = Router();
  router.use(new BodyProfileAPI(repository).router);
  router.use(new LoyaltyAPI(new LoyaltyQueryService(prisma)).router);
  return router;
}
