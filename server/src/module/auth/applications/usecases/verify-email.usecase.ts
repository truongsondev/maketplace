import { VerifyEmailCommand, VerifyEmailResult } from '../dto';
import { InvalidTokenError, UserNotFoundError } from '../errors';
import {
  IEmailVerificationTokenRepository,
  ITokenGenerator,
  IUserRepository,
} from '../ports';
import { IVerifyEmailUseCase } from '../ports/input/verify-email.usecase';

/**
 * Use Case: Verify email using token
 */
export class VerifyEmailUseCase implements IVerifyEmailUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly tokenGenerator: ITokenGenerator,
    private readonly emailVerificationTokenRepository: IEmailVerificationTokenRepository,
  ) {}

  async execute(command: VerifyEmailCommand): Promise<VerifyEmailResult> {
    const { token } = command;

    // Hash the provided token to match against stored hash
    const tokenHash = this.tokenGenerator.hashToken(token);

    // Find token in database
    const emailVerificationToken = await this.emailVerificationTokenRepository.findByTokenHash(
      tokenHash,
    );

    if (!emailVerificationToken) {
      throw new InvalidTokenError();
    }

    // Check if token is expired
    if (emailVerificationToken.expiresAt < new Date()) {
      // Clean up expired token
      await this.emailVerificationTokenRepository.deleteByTokenHash(tokenHash);
      throw new InvalidTokenError();
    }

    // Find user
    const user = await this.userRepository.findById(emailVerificationToken.userId);
    if (!user) {
      throw new UserNotFoundError();
    }

    // Update user as email verified
    user.verifyEmail();
    await this.userRepository.save(user);

    // Delete used token
    await this.emailVerificationTokenRepository.deleteByTokenHash(tokenHash);

    return {
      message: 'Email verified successfully.',
    };
  }
}