import { User, UserStatus } from '../../entities/user/user.entity';
import { AuthResult, LoginWithEmailCommand, UserDto } from '../dto';
import { InvalidCredentialsError, UserNotActiveError } from '../errors';
import {
  ILoginWithEmailUseCase,
  IPasswordHasher,
  IRefreshTokenRepository,
  ITokenProvider,
  IUserRepository,
} from '../ports';

/**
 * Use Case: Login with email and password
 */
export class LoginWithEmailUseCase implements ILoginWithEmailUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokenProvider: ITokenProvider,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  async execute(command: LoginWithEmailCommand): Promise<AuthResult> {
    const { email, password } = command;

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new InvalidCredentialsError();
    }

    if (!user.passwordHash) {
      throw new InvalidCredentialsError();
    }

    const isPasswordValid = await this.passwordHasher.compare(
      password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new InvalidCredentialsError();
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UserNotActiveError(user.status);
    }

    const accessToken = this.tokenProvider.generateAccessToken({
      userId: user.id!,
      email: user.email?.getValue(),
      roles: ['BUYER'],
    });

    const refreshToken = this.tokenProvider.generateRefreshToken();
    const expiresAt = this.tokenProvider.getRefreshTokenExpiresAt();

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
