import { User } from '../../entities/user/user.entity';
import { Email } from '../../entities/value-object/email.vo';
import { RegisterCommand, RegisterResult } from '../dto';
import { EmailAlreadyExistsError } from '../errors';
import {
  IEmailSender,
  IEmailVerificationTokenRepository,
  IPasswordHasher,
  IRateLimiter,
  ITokenGenerator,
  IUserRepository,
  EmailVerificationToken,
} from '../ports';
import { IRegisterUseCase } from '../ports/input/register.usecase';
import { RateLimitHelper, isDuplicateEmailError } from '../utils';
import { createLogger } from '@/shared/util/logger';

export class RegisterUseCase implements IRegisterUseCase {
  private readonly rateLimitHelper: RateLimitHelper;
  private readonly logger = createLogger('RegisterUseCase');

  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly rateLimiter: IRateLimiter,
    private readonly tokenGenerator: ITokenGenerator,
    private readonly emailVerificationTokenRepository: IEmailVerificationTokenRepository,
    private readonly emailSender: IEmailSender,
    private readonly ipAddress?: string,
  ) {
    this.rateLimitHelper = new RateLimitHelper(rateLimiter);
  }

  async execute(command: RegisterCommand): Promise<RegisterResult> {
    const { email: emailString, password } = command;

    this.logger.info('Starting user registration', { email: emailString });

    await this.rateLimitHelper.checkRateLimit(emailString, this.ipAddress);

    const hashedPassword = await this.passwordHasher.hash(password);

    const email = new Email(emailString);

    const user = User.registerWithEmail(email, hashedPassword);

    try {
      const savedUser = await this.userRepository.save(user);

      const rawToken = this.tokenGenerator.generateRandomToken(32);
      const tokenHash = this.tokenGenerator.hashToken(rawToken);
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

      const emailVerificationToken: EmailVerificationToken = {
        id: '',
        userId: savedUser.id!,
        tokenHash,
        expiresAt,
        createdAt: new Date(),
      };

      await this.emailVerificationTokenRepository.save(emailVerificationToken);

      await this.emailSender.sendEmailVerification(emailString, rawToken);

      this.logger.info('User registered successfully', {
        userId: savedUser.id,
        email: emailString,
      });

      return {
        message: 'Registration successful. Please verify your email.',
      };
    } catch (error: any) {
      if (isDuplicateEmailError(error)) {
        this.logger.warn('Registration failed: Email already exists', { email: emailString });
        throw new EmailAlreadyExistsError();
      }
      this.logger.error('Registration failed with unexpected error', error, { email: emailString });
      throw error;
    }
  }
}
