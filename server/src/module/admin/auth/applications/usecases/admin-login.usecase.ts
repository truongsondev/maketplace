import { createLogger } from '@/shared/util/logger';
import { InvalidCredentialsError } from '../../../../auth/applications/errors';
import {
  IPasswordHasher,
  IRateLimiter,
  ITokenGenerator,
} from '../../../../auth/applications/ports/output';
import { IRedisCache } from '../../../../auth/applications/ports/output/redis-cache';
import { ITokenRepository } from '../../../../auth/applications/ports/output/token.repository';
import { RateLimitHelper } from '../../../../auth/applications/utils';
import { UserStatus } from '../../../../auth/entities/user/user.entity';
import { AdminLoginCommand, AdminLoginResult } from '../dto';
import { IAdminLoginUseCase } from '../ports/input';
import { IAdminUserRepository } from '../ports/output';

const ACCESS_TOKEN_TTL_SECONDS = 3600;

export class AdminLoginUseCase implements IAdminLoginUseCase {
  private readonly rateLimitHelper: RateLimitHelper;
  private readonly logger = createLogger('AdminLoginUseCase');

  constructor(
    private readonly rateLimiter: IRateLimiter,
    private readonly passwordHasher: IPasswordHasher,
    private readonly userRepository: IAdminUserRepository,
    private readonly tokenGenerator: ITokenGenerator,
    private readonly tokenRepository: ITokenRepository,
    private readonly redisCache: IRedisCache,
  ) {
    this.rateLimitHelper = new RateLimitHelper(rateLimiter);
  }

  async execute(command: AdminLoginCommand, ipAddress?: string): Promise<AdminLoginResult> {
    const { email, password, deviceInfo } = command;

    this.logger.info('Admin login attempt', { email, deviceInfo });

    await this.rateLimitHelper.checkRateLimit(email, ipAddress);

    const user = await this.userRepository.findByEmailWithRoles(email);
    const hashToCompare = user?.passwordHash ?? '';
    const isPasswordValid = await this.passwordHasher.compare(password, hashToCompare);

    if (!user || !isPasswordValid) {
      this.logger.warn('Admin login failed: invalid credentials', { email });
      throw new InvalidCredentialsError();
    }

    if (!user.emailVerified || user.status !== UserStatus.ACTIVE) {
      this.logger.warn('Admin login failed: account is not eligible', {
        email,
        userId: user.id,
        status: user.status,
      });
      throw new InvalidCredentialsError();
    }

    if (!user.roleCodes.includes('ADMIN')) {
      this.logger.warn('Admin login failed: user has no ADMIN role', {
        email,
        userId: user.id,
        roles: user.roleCodes,
      });
      throw new InvalidCredentialsError();
    }

    const accessToken = this.tokenGenerator.generateRandomToken();
    const refreshToken = this.tokenGenerator.generateRandomToken();
    const hashedRefreshToken = this.tokenGenerator.hashToken(refreshToken);

    await Promise.all([
      this.redisCache.set(`session:${accessToken}`, user.id, ACCESS_TOKEN_TTL_SECONDS),
      this.tokenRepository.saveToken(user.id, hashedRefreshToken, deviceInfo),
      this.userRepository.updateLastLogin(user.id),
    ]);

    this.logger.info('Admin login successful', { email, userId: user.id });

    return {
      token: {
        accessToken,
        refreshToken,
      },
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        roles: user.roleCodes,
      },
    };
  }
}
