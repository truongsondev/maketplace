import {
  IEmailSender,
  IPasswordResetTokenRepository,
  IRateLimiter,
  ITokenGenerator,
  IUserRepository,
} from '../../applications/ports';
import { ForgotPasswordUseCase } from '../../applications/usecases/forgot-password.usecase';
import { IForgotPasswordUseCase } from '../../applications/ports/input/forgot-password.usecase';

export interface IForgotPasswordUseCaseFactory {
  create(ipAddress?: string): IForgotPasswordUseCase;
}

export class ForgotPasswordUseCaseFactory implements IForgotPasswordUseCaseFactory {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly tokenGenerator: ITokenGenerator,
    private readonly passwordResetTokenRepository: IPasswordResetTokenRepository,
    private readonly emailSender: IEmailSender,
    private readonly rateLimiter: IRateLimiter,
  ) {}

  create(ipAddress?: string): IForgotPasswordUseCase {
    return new ForgotPasswordUseCase(
      this.userRepository,
      this.tokenGenerator,
      this.passwordResetTokenRepository,
      this.emailSender,
      this.rateLimiter,
      ipAddress,
    );
  }
}
