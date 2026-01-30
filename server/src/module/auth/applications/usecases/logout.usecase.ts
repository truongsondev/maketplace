import { LogoutCommand } from '../dto';
import { ILogoutUseCase, IRefreshTokenRepository } from '../ports';

/**
 * Use Case: Logout user by revoking refresh token
 */
export class LogoutUseCase implements ILogoutUseCase {
  constructor(
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  async execute(command: LogoutCommand): Promise<void> {
    const { refreshToken } = command;

    // Revoke the refresh token
    await this.refreshTokenRepository.revoke(refreshToken);
  }
}
