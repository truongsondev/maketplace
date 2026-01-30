import { Router } from 'express';
import { prisma } from '../../infrastructure/database/prisma.service';

import { RegisterWithEmailUseCase } from './applications/usecases/register-with-email.usecase';
import { RegisterWithPhoneUseCase } from './applications/usecases/register-with-phone.usecase';

import { PrismaUserRepository } from './infrastructure/repositories/prisma-user.repository';
import { PrismaRefreshTokenRepository } from './infrastructure/repositories/prisma-refresh-token.repository';
import { PrismaOtpRepository } from './infrastructure/repositories/prisma-otp.repository';
import { CryptoPasswordHasher } from './infrastructure/security/crypto-password-hasher';
import { CryptoOtpGenerator } from './infrastructure/security/crypto-otp-generator';
import { JwtTokenProvider } from './infrastructure/security/jwt-token-provider';
import { EmailSender } from './infrastructure/email/console-email-sender';
import { AuthAPI } from './infrastructure/api/auth.api';

import { AuthController } from './interface-adapter/controller/auth.controller';
import { AuthPresenter } from './interface-adapter/presenter/auth.presenter';
import { VerifyEmailOtpUseCase } from './applications';
import { OTPPresenter } from './interface-adapter';

export function createAuthModule(): Router {
  const userRepository = new PrismaUserRepository(prisma);
  const refreshTokenRepository = new PrismaRefreshTokenRepository(prisma);

  const otpRepository = new PrismaOtpRepository(prisma);
  const otpGenerator = new CryptoOtpGenerator();
  const emailSender = new EmailSender({
    appName: 'Marketplace',
    expiresInMinutes: 10,
  });

  const passwordHasher = new CryptoPasswordHasher();
  const tokenProvider = new JwtTokenProvider({
    accessTokenExpiresIn: 15 * 60,
    refreshTokenExpiresIn: 7 * 24 * 60 * 60,
  });

  const registerWithEmailUseCase = new RegisterWithEmailUseCase(
    userRepository,
    passwordHasher,
    tokenProvider,
    refreshTokenRepository,
    otpGenerator,
    otpRepository,
    emailSender,
  );

  const registerWithPhoneUseCase = new RegisterWithPhoneUseCase(
    userRepository,
    passwordHasher,
    tokenProvider,
    refreshTokenRepository,
  );

  const verifyEmailOtpUseCase = new VerifyEmailOtpUseCase(
    userRepository,
    otpRepository,
    tokenProvider,
    refreshTokenRepository,
  );

  const presenter = new AuthPresenter();
  const otpPresenter = new OTPPresenter();
  const controller = new AuthController(
    registerWithEmailUseCase,
    registerWithPhoneUseCase,
    verifyEmailOtpUseCase,
    presenter,
    otpPresenter,
  );

  const authAPI = new AuthAPI(controller);

  return authAPI.router;
}

export const AuthConnect = createAuthModule;
