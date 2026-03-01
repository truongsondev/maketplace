import { ForgotPasswordCommand, ForgotPasswordResult } from '../dto';
import {
  IEmailSender,
  IPasswordResetTokenRepository,
  IRateLimiter,
  ITokenGenerator,
  IUserRepository,
  PasswordResetToken,
} from '../ports';
import { IForgotPasswordUseCase } from '../ports/input/forgot-password.usecase';
import { RateLimitHelper } from '../utils';

const RESET_TOKEN_TTL_MINUTES = 15;

export class ForgotPasswordUseCase implements IForgotPasswordUseCase {
  private readonly rateLimitHelper: RateLimitHelper;

  constructor(
    private readonly userRepository: IUserRepository,
    private readonly tokenGenerator: ITokenGenerator,
    private readonly passwordResetTokenRepository: IPasswordResetTokenRepository,
    private readonly emailSender: IEmailSender,
    private readonly rateLimiter: IRateLimiter,
    private readonly ipAddress?: string,
  ) {
    this.rateLimitHelper = new RateLimitHelper(rateLimiter);
  }

  async execute(command: ForgotPasswordCommand): Promise<ForgotPasswordResult> {
    const { email } = command;

    await this.rateLimitHelper.checkRateLimit(email, this.ipAddress);

    const user = await this.userRepository.findByEmail(email);

    if (user && user.id) {
      await this.passwordResetTokenRepository.deleteByUserId(user.id);

      const rawToken = this.tokenGenerator.generateRandomToken(32);
      const tokenHash = this.tokenGenerator.hashToken(rawToken);
      const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000);

      const resetToken: PasswordResetToken = {
        id: '',
        userId: user.id,
        tokenHash,
        expiresAt,
        createdAt: new Date(),
      };

      await this.passwordResetTokenRepository.save(resetToken);
      await this.emailSender.sendPasswordReset(email, rawToken);
    }

    return {
      message: 'If an account with that email exists, a password reset link has been sent.',
    };
  }
}
