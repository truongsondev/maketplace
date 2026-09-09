import { IRegisterUseCase } from '../../applications/ports/input';
import {
  IEmailSender,
  IEmailVerificationTokenRepository,
  IPasswordHasher,
  IRateLimiter,
  ITokenGenerator,
  IUserRepository,
} from '../../applications/ports/output';
import { RegisterUseCase } from '../../applications/usecases';

export interface IRegisterUseCaseFactory {
  create(ipAddress?: string): IRegisterUseCase;
}

export class RegisterUseCaseFactory implements IRegisterUseCaseFactory {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly rateLimiter: IRateLimiter,
    private readonly tokenGenerator: ITokenGenerator,
    private readonly emailVerificationTokenRepository: IEmailVerificationTokenRepository,
    private readonly emailSender: IEmailSender,
  ) {}

  create(ipAddress?: string): IRegisterUseCase {
    return new RegisterUseCase(
      this.userRepository,
      this.passwordHasher,
      this.rateLimiter,
      this.tokenGenerator,
      this.emailVerificationTokenRepository,
      this.emailSender,
      ipAddress,
    );
  }
}
