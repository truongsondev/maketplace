import { Router } from 'express';
import { prisma, redis } from '../../infrastructure/database';

import { VerifyEmailUseCase } from './applications/usecases/verify-email.usecase';

import { PrismaUserRepository } from './infrastructure/repositories/prisma-user.repository';
import { PrismaEmailVerificationTokenRepository } from './infrastructure/repositories/prisma-email-verification-token.repository';
import { CryptoPasswordHasher } from './infrastructure/security/crypto-password-hasher';
import { CryptoTokenGenerator } from './infrastructure/security/crypto-token-generator';
import { RedisRateLimiter } from './infrastructure/security/redis-rate-limiter';
import { EmailSender } from './infrastructure/email/console-email-sender';
import { AuthAPI } from './infrastructure/api/auth.api';

import { AuthController } from './interface-adapter/controller/auth.controller';
import { RegisterUseCaseFactory } from './interface-adapter/controller/register-usecase.factory';

export function createAuthModule(): Router {
  const userRepository = new PrismaUserRepository(prisma);
  const emailVerificationTokenRepository = new PrismaEmailVerificationTokenRepository(prisma);

  const passwordHasher = new CryptoPasswordHasher();
  const tokenGenerator = new CryptoTokenGenerator();
  const rateLimiter = new RedisRateLimiter(redis);
  const emailSender = new EmailSender();

  const verifyEmailUseCase = new VerifyEmailUseCase(
    userRepository,
    tokenGenerator,
    emailVerificationTokenRepository,
  );

  const registerUseCaseFactory = new RegisterUseCaseFactory(
    userRepository,
    passwordHasher,
    rateLimiter,
    tokenGenerator,
    emailVerificationTokenRepository,
    emailSender,
  );

  const controller = new AuthController(
    registerUseCaseFactory,
    verifyEmailUseCase,
  );

  const authAPI = new AuthAPI(controller);

  return authAPI.router;
}

export const AuthConnect = createAuthModule;
