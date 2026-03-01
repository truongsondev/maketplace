import { LogoutCommand } from '../dto/command/logout.command';
import { LogoutResult } from '../dto/result/logout.result';
import { ILogoutUseCase } from '../ports/input/logout.usecase';
import { IRedisCache } from '../ports/output/redis-cache';
import { ITokenRepository } from '../ports/output/token.repository';
import { ITokenGenerator } from '../ports/output/token-generator';

export class LogoutUseCase implements ILogoutUseCase {
  constructor(
    private readonly redisCache: IRedisCache,
    private readonly tokenRepository: ITokenRepository,
    private readonly tokenGenerator: ITokenGenerator,
  ) {}

  async execute(command: LogoutCommand): Promise<LogoutResult> {
    const { accessToken, refreshToken } = command;

    // 1. Xoá session access token khỏi Redis (idempotent — không lỗi nếu đã xoá)
    await this.redisCache.delete(`session:${accessToken}`);

    // 2. Thu hồi refresh token trong DB nếu client gửi lên
    if (refreshToken) {
      const hashedRefreshToken = this.tokenGenerator.hashToken(refreshToken);
      await this.tokenRepository.revokeTokenByHash(hashedRefreshToken);
    }

    return { message: 'Logged out successfully' };
  }
}
