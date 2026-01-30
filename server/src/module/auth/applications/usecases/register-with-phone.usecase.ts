import { User } from '../../entities/user/user.entity';
import { Phone } from '../../entities/value-object/phone.vo';
import { AuthResult, RegisterWithPhoneCommand, UserDto } from '../dto';
import { PhoneAlreadyExistsError } from '../errors';
import {
  IPasswordHasher,
  IRefreshTokenRepository,
  IRegisterWithPhoneUseCase,
  ITokenProvider,
  IUserRepository,
} from '../ports';

/**
 * Use Case: Register a new user with phone and password
 */
export class RegisterWithPhoneUseCase implements IRegisterWithPhoneUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokenProvider: ITokenProvider,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  async execute(command: RegisterWithPhoneCommand): Promise<AuthResult> {
    const { phone, password } = command;

    const phoneExists = await this.userRepository.existsByPhone(phone);
    if (phoneExists) {
      throw new PhoneAlreadyExistsError();
    }

    const phoneVO = new Phone(phone);

    const passwordHash = await this.passwordHasher.hash(password);

    const user = User.registerWithPhone(phoneVO, passwordHash);

    const savedUser = await this.userRepository.save(user);

    const accessToken = this.tokenProvider.generateAccessToken({
      userId: savedUser.id!,
      phone: savedUser.phone?.getValue(),
      roles: ['BUYER'],
    });

    const refreshToken = this.tokenProvider.generateRefreshToken();
    const expiresAt = this.tokenProvider.getRefreshTokenExpiresAt();

    await this.refreshTokenRepository.create(
      savedUser.id!,
      refreshToken,
      expiresAt,
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: this.tokenProvider.getAccessTokenExpiresIn(),
      user: this.toUserDto(savedUser),
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
