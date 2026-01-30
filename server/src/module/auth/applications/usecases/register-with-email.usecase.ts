import { User } from '../../entities/user/user.entity';
import { Email } from '../../entities/value-object/email.vo';
import { AuthResult, RegisterWithEmailCommand, UserDto } from '../dto';
import { EmailAlreadyExistsError } from '../errors';
import {
  IEmailSender,
  IPasswordHasher,
  IOtpGenerator,
  IOtpRepository,
  IRefreshTokenRepository,
  IRegisterWithEmailUseCase,
  ITokenProvider,
  IUserRepository,
} from '../ports';

const OTP_EXPIRES_IN_MINUTES = 10;

/**
 * Use Case: Register a new user with email and password
 */
export class RegisterWithEmailUseCase implements IRegisterWithEmailUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokenProvider: ITokenProvider,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly otpGenerator: IOtpGenerator,
    private readonly otpRepository: IOtpRepository,
    private readonly emailSender: IEmailSender,
  ) {}

  async execute(command: RegisterWithEmailCommand): Promise<AuthResult> {
    const { email, password } = command;

    const emailExists = await this.userRepository.existsByEmail(email);
    if (emailExists) {
      throw new EmailAlreadyExistsError();
    }

    const emailVO = new Email(email);

    const passwordHash = await this.passwordHasher.hash(password);

    const user = User.registerWithEmail(emailVO, passwordHash);

    const savedUser = await this.userRepository.save(user);

    const otp = this.otpGenerator.generate(6);
    const otpExpiresAt = new Date();
    otpExpiresAt.setMinutes(otpExpiresAt.getMinutes() + OTP_EXPIRES_IN_MINUTES);

    const accessToken = this.tokenProvider.generateAccessToken({
      userId: savedUser.id!,
      email: savedUser.email?.getValue(),
      roles: ['BUYER'],
    });

    const refreshToken = this.tokenProvider.generateRefreshToken();
    const refreshTokenExpiresAt = this.tokenProvider.getRefreshTokenExpiresAt();

    await Promise.all([
      this.otpRepository.save({
        email: emailVO.getValue(),
        otp,
        password: '',
        expiresAt: otpExpiresAt,
        attempts: 0,
      }),

      this.emailSender.sendOtpEmail(emailVO.getValue(), otp),

      this.refreshTokenRepository.create(
        savedUser.id!,
        refreshToken,
        refreshTokenExpiresAt,
      ),
    ]);

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
