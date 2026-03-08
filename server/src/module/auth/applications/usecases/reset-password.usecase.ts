import { ResetPasswordCommand, ResetPasswordResult } from '../dto';
import {
  IPasswordHasher,
  IPasswordResetTokenRepository,
  ITokenGenerator,
  IUserRepository,
} from '../ports';
import { IResetPasswordUseCase } from '../ports/input/reset-password.usecase';
import { InvalidTokenError, UserNotFoundError } from '../errors';

export class ResetPasswordUseCase implements IResetPasswordUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokenGenerator: ITokenGenerator,
    private readonly passwordResetTokenRepository: IPasswordResetTokenRepository,
  ) {}

  async execute(command: ResetPasswordCommand): Promise<ResetPasswordResult> {
    const { token, newPassword } = command;

    const tokenHash = this.tokenGenerator.hashToken(token);
    const resetToken = await this.passwordResetTokenRepository.findByTokenHash(tokenHash);

    if (!resetToken) {
      throw new InvalidTokenError();
    }

    if (resetToken.expiresAt < new Date()) {
      await this.passwordResetTokenRepository.deleteByTokenHash(tokenHash);
      throw new InvalidTokenError();
    }

    const user = await this.userRepository.findById(resetToken.userId);
    if (!user) {
      throw new UserNotFoundError();
    }

    const newPasswordHash = await this.passwordHasher.hash(newPassword);
    user.changePassword(newPasswordHash);
    await this.userRepository.save(user);

    await this.passwordResetTokenRepository.deleteByTokenHash(tokenHash);

    return {
      message: 'Password has been reset successfully. You can now log in with your new password.',
    };
  }
}
