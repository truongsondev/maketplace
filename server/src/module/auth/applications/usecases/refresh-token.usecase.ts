import { RefreshTokenCommand, RefreshTokenResult } from '../dto';
import { IRefreshTokenUseCase, ITokenGenerator, IUserRepository } from '../ports';
import { InvalidCredentialsError } from '../errors';
import { UserStatus } from '../../entities/user/user.entity';
import { IRedisCache } from '../ports/output/redis-cache';
import { ITokenRepository } from '../ports/output/token.repository';
import { createLogger } from '@/shared/util/logger';
import { PrismaClient } from '@/generated/prisma/client';

const ACCESS_TOKEN_TTL_SECONDS = 3600; // 1 hour

export class RefreshTokenUseCase implements IRefreshTokenUseCase {
  private readonly logger = createLogger('RefreshTokenUseCase');

  constructor(
    private readonly userRepo: IUserRepository,
    private readonly tokenGenerator: ITokenGenerator,
    private readonly tokenRepo: ITokenRepository,
    private readonly redisCache: IRedisCache,
    private readonly prisma: PrismaClient,
  ) {}

  async execute(command: RefreshTokenCommand): Promise<RefreshTokenResult> {
    const { refreshToken } = command;

    this.logger.info('Refresh token attempt');

    // Hash the incoming refresh token
    const hashedRefreshToken = this.tokenGenerator.hashToken(refreshToken);
    try {
      // Tìm token trong database
      const tokenRecord = await this.prisma.refreshToken.findFirst({
        where: {
          token: hashedRefreshToken,
          revoked: false,
          expiresAt: {
            gt: new Date(),
          },
        },
      });

      if (!tokenRecord) {
        this.logger.warn('Refresh token invalid or expired');
        throw new InvalidCredentialsError();
      }

      // Lấy user từ token
      const user = await this.userRepo.findById(tokenRecord.userId);

      if (!user) {
        this.logger.warn('User not found for refresh token', { userId: tokenRecord.userId });
        throw new InvalidCredentialsError();
      }

      if (!user.emailVerified) {
        this.logger.warn('Refresh token failed: Email not verified', {
          email: user.email,
          userId: user.id,
        });
        throw new InvalidCredentialsError();
      }

      if (user.status !== UserStatus.ACTIVE) {
        this.logger.warn('Refresh token failed: User account not active', {
          email: user.email,
          userId: user.id,
          status: user.status,
        });
        throw new InvalidCredentialsError();
      }

      // Tạo access token và refresh token mới
      const newAccessToken = this.tokenGenerator.generateRandomToken();
      const newRefreshToken = this.tokenGenerator.generateRandomToken();
      const hashedNewRefreshToken = this.tokenGenerator.hashToken(newRefreshToken);

      // Thu hồi refresh token cũ và lưu token mới
      await Promise.all([
        this.redisCache.set(`session:${newAccessToken}`, user.id!, ACCESS_TOKEN_TTL_SECONDS),
        this.tokenRepo.revokeTokenByHash(hashedRefreshToken),
        this.tokenRepo.saveToken(
          user.id!,
          hashedNewRefreshToken,
          tokenRecord.deviceInfo || undefined,
        ),
      ]);

      this.logger.info('Refresh token successful', { userId: user.id, email: user.email });

      return {
        token: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        },
        user,
        profile: user.profile || undefined,
      };
    } catch (error) {
      try {
        await this.tokenRepo.revokeTokenByHash(hashedRefreshToken);
      } catch (revokeError) {
        this.logger.error('Failed to revoke refresh token after refresh failure', {
          revokeError,
        });
      }

      if (error instanceof InvalidCredentialsError) {
        throw error;
      }

      this.logger.warn('Refresh token failed unexpectedly, returning unauthorized', { error });
      throw new InvalidCredentialsError();
    }
  }
}
