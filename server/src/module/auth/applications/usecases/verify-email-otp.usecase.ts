import { User } from '../../entities/user/user.entity';
import { Email } from '../../entities/value-object/email.vo';
import { OTPResult, UserDto, VerifyEmailOtpCommand } from '../dto';
import {
  InvalidOtpError,
  OtpNotFoundError,
  TooManyOtpAttemptsError,
} from '../errors';
import {
  IOtpRepository,
  IRefreshTokenRepository,
  ITokenProvider,
  IUserRepository,
  IVerifyEmailOtpUseCase,
} from '../ports';

const MAX_OTP_ATTEMPTS = 5;

/**
 * Use Case: Verify OTP and complete email registration
 * This is the second step of the two-step registration process
 */
export class VerifyEmailOtpUseCase implements IVerifyEmailOtpUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly otpRepository: IOtpRepository,
    private readonly tokenProvider: ITokenProvider,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  async execute(command: VerifyEmailOtpCommand): Promise<OTPResult> {
    const { email, otp } = command;

    // Validate email format
    const emailVO = new Email(email);

    // Find OTP data
    const otpData = await this.otpRepository.findByEmail(emailVO.getValue());
    if (!otpData) {
      throw new OtpNotFoundError();
    }

    // Check if too many attempts
    if (otpData.attempts >= MAX_OTP_ATTEMPTS) {
      await this.otpRepository.deleteByEmail(emailVO.getValue());
      throw new TooManyOtpAttemptsError();
    }

    // Check if OTP is expired
    if (new Date() > otpData.expiresAt) {
      await this.otpRepository.deleteByEmail(emailVO.getValue());
      throw new InvalidOtpError();
    }

    // Verify OTP
    if (otpData.otp !== otp) {
      await this.otpRepository.incrementAttempts(emailVO.getValue());
      throw new InvalidOtpError();
    }

    // OTP is valid - verify existing user or create new one (supports both flows)
    const existingUser = await this.userRepository.findByEmail(
      emailVO.getValue(),
    );

    const userToSave = existingUser
      ? (() => {
          existingUser.verifyEmail();
          return existingUser;
        })()
      : (() => {
          const newUser = User.registerWithEmail(emailVO, otpData.password);
          newUser.verifyEmail();
          return newUser;
        })();

    await Promise.all([
      this.userRepository.save(userToSave),
      this.otpRepository.deleteByEmail(emailVO.getValue()),
    ]);

    return {
      status: true,
      message: 'Email verified successfully',
    };
  }
}
