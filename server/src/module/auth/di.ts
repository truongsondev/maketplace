import { Router } from 'express';
import { prisma, redis } from '../../infrastructure/database';

import { VerifyEmailUseCase } from './applications/usecases/verify-email.usecase';
import { ResetPasswordUseCase } from './applications/usecases/reset-password.usecase';
import { LogoutUseCase } from './applications/usecases/logout.usecase';

import { PrismaUserRepository } from './infrastructure/repositories/prisma-user.repository';
import { PrismaEmailVerificationTokenRepository } from './infrastructure/repositories/prisma-email-verification-token.repository';
import { PrismaPasswordResetTokenRepository } from './infrastructure/repositories/prisma-password-reset-token.repository';
import { CryptoPasswordHasher } from './infrastructure/security/crypto-password-hasher';
import { CryptoTokenGenerator } from './infrastructure/security/crypto-token-generator';
import { RedisRateLimiter } from './infrastructure/security/redis-rate-limiter';
import { EmailSender } from './infrastructure/email/console-email-sender';
import { AuthAPI } from './infrastructure/api/auth.api';

import { AuthController } from './interface-adapter/controller/auth.controller';
import { RegisterUseCaseFactory } from './interface-adapter/pattern/register-usecase.factory';
import { LoginUseCaseFactory } from './interface-adapter/pattern/login-usecase.factory';
import { ForgotPasswordUseCaseFactory } from './interface-adapter/pattern/forgot-password-usecase.factory';
import { PrismaTokenRepository } from './infrastructure/repositories/prisma-token.repository';
import { RedisCache } from './infrastructure/security/redis-cache';

export function createAuthModule(): Router {
  const userRepository = new PrismaUserRepository(prisma);
  const tokenRepository = new PrismaTokenRepository(prisma);
  const emailVerificationTokenRepository = new PrismaEmailVerificationTokenRepository(prisma);
  const passwordResetTokenRepository = new PrismaPasswordResetTokenRepository(prisma);

  const passwordHasher = new CryptoPasswordHasher();
  const tokenGenerator = new CryptoTokenGenerator();
  const rateLimiter = new RedisRateLimiter(redis);
  const redisCache = new RedisCache(redis);
  const emailSender = new EmailSender();

  const verifyEmailUseCase = new VerifyEmailUseCase(
    userRepository,
    tokenGenerator,
    emailVerificationTokenRepository,
  );

  const resetPasswordUseCase = new ResetPasswordUseCase(
    userRepository,
    passwordHasher,
    tokenGenerator,
    passwordResetTokenRepository,
  );

  const registerUseCaseFactory = new RegisterUseCaseFactory(
    userRepository,
    passwordHasher,
    rateLimiter,
    tokenGenerator,
    emailVerificationTokenRepository,
    emailSender,
  );

  const loginUseCaseFactory = new LoginUseCaseFactory(
    userRepository,
    passwordHasher,
    tokenGenerator,
    tokenRepository,
    redisCache,
    rateLimiter,
  );

  const forgotPasswordUseCaseFactory = new ForgotPasswordUseCaseFactory(
    userRepository,
    tokenGenerator,
    passwordResetTokenRepository,
    emailSender,
    rateLimiter,
  );

  const logoutUseCase = new LogoutUseCase(redisCache, tokenRepository, tokenGenerator);

  const controller = new AuthController(
    registerUseCaseFactory,
    verifyEmailUseCase,
    loginUseCaseFactory,
    forgotPasswordUseCaseFactory,
    resetPasswordUseCase,
    logoutUseCase,
  );

  const authAPI = new AuthAPI(controller);

  return authAPI.router;
}

export const AuthConnect = createAuthModule;
