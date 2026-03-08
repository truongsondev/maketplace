import { VerifyEmailCommand, VerifyEmailResult } from '../dto';
import { InvalidTokenError, UserNotFoundError } from '../errors';
import { IEmailVerificationTokenRepository, ITokenGenerator, IUserRepository } from '../ports';
import { IVerifyEmailUseCase } from '../ports/input/verify-email.usecase';

export class VerifyEmailUseCase implements IVerifyEmailUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly tokenGenerator: ITokenGenerator,
    private readonly emailVerificationTokenRepository: IEmailVerificationTokenRepository,
  ) {}

  async execute(command: VerifyEmailCommand): Promise<VerifyEmailResult> {
    const { token } = command;

    const tokenHash = this.tokenGenerator.hashToken(token);

    const emailVerificationToken =
      await this.emailVerificationTokenRepository.findByTokenHash(tokenHash);

    if (!emailVerificationToken) {
      throw new InvalidTokenError();
    }

    if (emailVerificationToken.expiresAt < new Date()) {
      await this.emailVerificationTokenRepository.deleteByTokenHash(tokenHash);
      throw new InvalidTokenError();
    }

    const user = await this.userRepository.findById(emailVerificationToken.userId);
    if (!user) {
      throw new UserNotFoundError();
    }

    user.verifyEmail();
    await this.userRepository.save(user);

    await this.emailVerificationTokenRepository.deleteByTokenHash(tokenHash);

    return {
      message: 'Email verified successfully.',
    };
  }
}
