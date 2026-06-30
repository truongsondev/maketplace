import { Router } from 'express';
import { prisma } from '../../infrastructure/database';
import { BodyProfileAPI } from './body-profile.api';
import { PrismaBodyProfileRepository } from './prisma-body-profile.repository';

export function createUserProfileModule(): Router {
  const repository = new PrismaBodyProfileRepository(prisma);
  return new BodyProfileAPI(repository).router;
}
