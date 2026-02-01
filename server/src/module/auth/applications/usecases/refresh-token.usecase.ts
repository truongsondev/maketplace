import { User, UserStatus } from '../../entities/user/user.entity';
import { AuthResult, RefreshTokenCommand, UserDto } from '../dto';
import {
  InvalidRefreshTokenError,
  UserNotActiveError,
  UserNotFoundError,
} from '../errors';
import {
  IRefreshTokenRepository,
  IRefreshTokenUseCase,
  ITokenProvider,
  IUserRepository,
} from '../ports';

/**
 * Use Case: Refresh access token using refresh token
 */
export class RefreshTokenUseCase implements IRefreshTokenUseCase {
  constructor(
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly userRepository: IUserRepository,
    private readonly tokenProvider: ITokenProvider,
  ) {}

  async execute(command: RefreshTokenCommand): Promise<AuthResult> {
    const { refreshToken } = command;

    // Find refresh token
    const tokenRecord =
      await this.refreshTokenRepository.findByToken(refreshToken);
    if (!tokenRecord) {
      throw new InvalidRefreshTokenError();
    }

    // Check if token is revoked
    if (tokenRecord.revoked) {
      throw new InvalidRefreshTokenError();
    }

    // Check if token is expired
    if (new Date() > tokenRecord.expiresAt) {
      throw new InvalidRefreshTokenError();
    }

    // Find user
    const user = await this.userRepository.findById(tokenRecord.userId);
    if (!user) {
      throw new UserNotFoundError();
    }

    // Check user status
    if (user.status !== UserStatus.ACTIVE) {
      throw new UserNotActiveError(user.status);
    }

    // Revoke old refresh token
    await this.refreshTokenRepository.revoke(refreshToken);

    // Generate new tokens
    const newAccessToken = this.tokenProvider.generateAccessToken({
      userId: user.id!,
      email: user.email?.getValue(),
      phone: user.phone?.getValue(),
      roles: ['BUYER'], // TODO: Fetch actual roles
    });

    const newRefreshToken = this.tokenProvider.generateRefreshToken();
    const expiresAt = this.tokenProvider.getRefreshTokenExpiresAt();

    // Save new refresh token
    await this.refreshTokenRepository.create(
      user.id!,
      newRefreshToken,
      expiresAt,
    );

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: this.tokenProvider.getAccessTokenExpiresIn(),
      user: this.toUserDto(user),
    };
  }

  private toUserDto(user: User): UserDto {
    return {
      id: user.id!,
      email: user.email?.getValue(),
      phone: user.phone?.getValue(),
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      status: user.status,
    };
  }
}
