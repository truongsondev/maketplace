import {
  ILoginUseCase,
  IPasswordHasher,
  IRateLimiter,
  ITokenGenerator,
  IUserRepository,
} from '../../applications';
import { IRedisCache } from '../../applications/ports/output/redis-cache';
import { ITokenRepository } from '../../applications/ports/output/token.repository';
import { LoginUseCase } from '../../applications/usecases/login.usecse';

export interface ILoginUseCaseFactory {
  create(ipAddress?: string): ILoginUseCase;
}

export class LoginUseCaseFactory implements ILoginUseCaseFactory {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokenGenerator: ITokenGenerator,
    private readonly tokenRepository: ITokenRepository,
    private readonly redisCache: IRedisCache,
    private readonly rateLimiter: IRateLimiter,
  ) {}

  create(ipAddress?: string): ILoginUseCase {
    return new LoginUseCase(
      this.rateLimiter,
      this.passwordHasher,
      this.userRepository,
      this.tokenGenerator,
      this.tokenRepository,
      this.redisCache,
      ipAddress,
    );
  }
}
