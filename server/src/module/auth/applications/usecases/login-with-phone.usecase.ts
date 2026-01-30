import { User, UserStatus } from '../../entities/user/user.entity';
import { AuthResult, LoginWithPhoneCommand, UserDto } from '../dto';
import { InvalidCredentialsError, UserNotActiveError } from '../errors';
import {
  ILoginWithPhoneUseCase,
  IPasswordHasher,
  IRefreshTokenRepository,
  ITokenProvider,
  IUserRepository,
} from '../ports';

/**
 * Use Case: Login with phone and password
 */
export class LoginWithPhoneUseCase implements ILoginWithPhoneUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokenProvider: ITokenProvider,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  async execute(command: LoginWithPhoneCommand): Promise<AuthResult> {
    const { phone, password } = command;

    // Find user by phone
    const user = await this.userRepository.findByPhone(phone);
    if (!user) {
      throw new InvalidCredentialsError();
    }

    // Check if user has password
    if (!user.passwordHash) {
      throw new InvalidCredentialsError();
    }

    // Verify password
    const isPasswordValid = await this.passwordHasher.compare(
      password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new InvalidCredentialsError();
    }

    // Check user status
    if (user.status !== UserStatus.ACTIVE) {
      throw new UserNotActiveError(user.status);
    }

    // Generate tokens
    const accessToken = this.tokenProvider.generateAccessToken({
      userId: user.id!,
      phone: user.phone?.getValue(),
      roles: ['BUYER'], // TODO: Fetch actual roles
    });

    const refreshToken = this.tokenProvider.generateRefreshToken();
    const expiresAt = this.tokenProvider.getRefreshTokenExpiresAt();

    // Save refresh token
    await this.refreshTokenRepository.create(user.id!, refreshToken, expiresAt);

    return {
      accessToken,
      refreshToken,
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
