import { Router } from 'express';
import { prisma, redis } from '../../../infrastructure/database';
import { PrismaTokenRepository } from '../../auth/infrastructure/repositories/prisma-token.repository';
import {
  CryptoPasswordHasher,
  CryptoTokenGenerator,
  RedisRateLimiter,
} from '../../auth/infrastructure/security';
import { RedisCache } from '../../auth/infrastructure/security/redis-cache';
import { AdminLoginUseCase } from './applications';
import { AdminAuthAPI } from './infrastructure';
import { PrismaAdminUserRepository } from './infrastructure/repositories';
import { AdminAuthController } from './interface-adapter';

export function createAdminAuthModule(): Router {
  const userRepository = new PrismaAdminUserRepository(prisma);
  const tokenRepository = new PrismaTokenRepository(prisma);

  const passwordHasher = new CryptoPasswordHasher();
  const tokenGenerator = new CryptoTokenGenerator();
  const rateLimiter = new RedisRateLimiter(redis);
  const redisCache = new RedisCache(redis);

  const adminLoginUseCase = new AdminLoginUseCase(
    rateLimiter,
    passwordHasher,
    userRepository,
    tokenGenerator,
    tokenRepository,
    redisCache,
  );

  const controller = new AdminAuthController(adminLoginUseCase);
  const adminAuthAPI = new AdminAuthAPI(controller);

  return adminAuthAPI.router;
}

export const AdminAuthConnect = createAdminAuthModule;
