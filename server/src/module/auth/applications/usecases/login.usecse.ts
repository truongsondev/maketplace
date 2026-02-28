import { LoginCommand, LoginResult } from '../dto';
import {
  ILoginUseCase,
  IPasswordHasher,
  IRateLimiter,
  ITokenGenerator,
  IUserRepository,
} from '../ports';
import { InvalidCredentialsError } from '../errors';
import { UserStatus } from '../../entities/user/user.entity';
import { IRedisCache } from '../ports/output/redis-cache';
import { ITokenRepository } from '../ports/output/token.repository';
import { RateLimitHelper } from '../utils';

const ACCESS_TOKEN_TTL_SECONDS = 3600; // 1 hour

export class LoginUseCase implements ILoginUseCase {
  private readonly rateLimitHelper: RateLimitHelper;

  constructor(
    private readonly rateLimiter: IRateLimiter,
    private readonly passwordHasher: IPasswordHasher,
    private readonly userRepo: IUserRepository,
    private readonly tokenGenerator: ITokenGenerator,
    private readonly tokenRepo: ITokenRepository,
    private readonly redisCache: IRedisCache,
    private readonly ipAddress?: string,
  ) {
    this.rateLimitHelper = new RateLimitHelper(rateLimiter);
  }

  async execute(command: LoginCommand): Promise<LoginResult> {
    const { email, password } = command;

    await this.rateLimitHelper.checkRateLimit(email, this.ipAddress);

    const user = await this.userRepo.findByEmail(email);

    const hashToCompare = user?.passwordHash ?? '';
    const isPasswordValid = await this.passwordHasher.compare(password, hashToCompare);
    if (!user || !isPasswordValid) {
      throw new InvalidCredentialsError();
    }

    if (!user.emailVerified) {
      throw new InvalidCredentialsError();
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new InvalidCredentialsError();
    }

    const accessToken = this.tokenGenerator.generateRandomToken();
    const refreshToken = this.tokenGenerator.generateRandomToken();
    const hashedRefreshToken = this.tokenGenerator.hashToken(refreshToken);

    await Promise.all([
      this.redisCache.set(`session:${accessToken}`, user.id!, ACCESS_TOKEN_TTL_SECONDS),
      this.tokenRepo.saveToken(user.id!, hashedRefreshToken),
    ]);

    return {
      token: {
        accessToken,
        refreshToken,
      },
      user,
    };
  }
}
