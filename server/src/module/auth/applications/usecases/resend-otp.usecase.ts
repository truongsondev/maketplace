import { Email } from '../../entities/value-object/email.vo';
import { OtpInitiatedResult, ResendOtpCommand } from '../dto';
import { OtpNotFoundError } from '../errors';
import {
  IEmailSender,
  IOtpGenerator,
  IOtpRepository,
  IResendOtpUseCase,
} from '../ports';

const OTP_EXPIRES_IN_MINUTES = 10;

/**
 * Use Case: Resend OTP email
 * Generates a new OTP and sends it to the email
 */
export class ResendOtpUseCase implements IResendOtpUseCase {
  constructor(
    private readonly otpRepository: IOtpRepository,
    private readonly otpGenerator: IOtpGenerator,
    private readonly emailSender: IEmailSender,
  ) {}

  async execute(command: ResendOtpCommand): Promise<OtpInitiatedResult> {
    const { email } = command;

    // Validate email format
    const emailVO = new Email(email);

    // Find existing OTP data (to get the stored password hash)
    const existingData = await this.otpRepository.findByEmail(
      emailVO.getValue(),
    );
    if (!existingData) {
      throw new OtpNotFoundError();
    }

    // Generate new OTP
    const otp = this.otpGenerator.generate(6);

    // Calculate new expiration time
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRES_IN_MINUTES);

    // Save new OTP data (reset attempts)
    await this.otpRepository.save({
      email: emailVO.getValue(),
      otp,
      password: existingData.password,
      expiresAt,
      attempts: 0,
    });

    // Send new OTP email
    await this.emailSender.sendOtpEmail(emailVO.getValue(), otp);

    return {
      message: 'New verification code sent to your email',
      email: emailVO.getValue(),
      expiresInMinutes: OTP_EXPIRES_IN_MINUTES,
    };
  }
}
