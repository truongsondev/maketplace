import { AuthUseCase } from './applications/usecase/auth.usecase';
import { UserPrisma } from './infrastructure/api/prisma/user.prisma';
import { CryptoPasswordHasher } from './infrastructure/security/password-hasher.crypto';
import { AuthAPI } from './infrastructure/api/auth.api';
import { AuthController } from './interface-adapter/controller/auth.controller';
import { AuthPresenter } from './interface-adapter/presenter/auth.presenter';

export function AuthConnect() {
  const userPrisma = new UserPrisma();
  const passwordHasher = new CryptoPasswordHasher();
  const authUseCase = new AuthUseCase(userPrisma, passwordHasher);
  const authPresenter = new AuthPresenter();
  const authController = new AuthController(authUseCase, authPresenter);
  const authAPI = new AuthAPI(authController);

  return authAPI.router;
}
