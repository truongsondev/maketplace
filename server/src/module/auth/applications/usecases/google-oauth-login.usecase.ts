import { OAuthProvider } from '@/generated/prisma/client';
import { createLogger } from '@/shared/util/logger';
import { GoogleOAuthLoginCommand, LoginResult } from '../dto';
import { ITokenGenerator, IUserRepository } from '../ports';
import { IRedisCache } from '../ports/output/redis-cache';
import { ITokenRepository } from '../ports/output/token.repository';
import { IOAuthAccountRepository } from '../ports/output/oauth-account.repository';
import { Email } from '../../entities/value-object/email.vo';
import { User, UserStatus } from '../../entities/user/user.entity';
import { InvalidCredentialsError } from '../errors';

const ACCESS_TOKEN_TTL_SECONDS = 3600; // 1 hour

export class GoogleOAuthLoginUseCase {
  private readonly logger = createLogger('GoogleOAuthLoginUseCase');

  constructor(
    private readonly userRepo: IUserRepository,
    private readonly oauthAccountRepo: IOAuthAccountRepository,
    private readonly tokenGenerator: ITokenGenerator,
    private readonly tokenRepo: ITokenRepository,
    private readonly redisCache: IRedisCache,
  ) {}

  async execute(command: GoogleOAuthLoginCommand): Promise<LoginResult> {
    const { providerUserId, email, deviceInfo } = command;

    if (!providerUserId) {
      throw new InvalidCredentialsError();
    }

    const normalizedEmail = (email || '').trim().toLowerCase();
    if (!normalizedEmail) {
      throw new InvalidCredentialsError();
    }

    const linkedUserId = await this.oauthAccountRepo.findUserIdByProvider(
      OAuthProvider.GOOGLE,
      providerUserId,
    );

    let user: User | null = null;
    if (linkedUserId) {
      user = await this.userRepo.findById(linkedUserId);
    }

    if (!user) {
      user = await this.userRepo.findByEmail(normalizedEmail);
    }

    if (!user) {
      user = await this.userRepo.save(User.registerWithOAuth(new Email(normalizedEmail)));
    } else if (!user.emailVerified) {
      // If user exists but email not verified, Google email implies verification.
      try {
        user.verifyEmail();
        user = await this.userRepo.save(user);
      } catch {
        // ignore
      }
    }

    if (user.status !== UserStatus.ACTIVE) {
      this.logger.warn('Google login blocked: user not active', {
        userId: user.id,
        status: user.status,
      });
      throw new InvalidCredentialsError();
    }

    await this.oauthAccountRepo.linkProviderToUser({
      userId: user.id!,
      provider: OAuthProvider.GOOGLE,
      providerUserId,
    });

    const accessToken = this.tokenGenerator.generateRandomToken();
    const refreshToken = this.tokenGenerator.generateRandomToken();
    const hashedRefreshToken = this.tokenGenerator.hashToken(refreshToken);

    await Promise.all([
      this.redisCache.set(`session:${accessToken}`, user.id!, ACCESS_TOKEN_TTL_SECONDS),
      this.tokenRepo.saveToken(user.id!, hashedRefreshToken, deviceInfo),
      this.userRepo.updateLastLogin(user.id!),
    ]);

    this.logger.info('User logged in with Google successfully', {
      userId: user.id,
      email: normalizedEmail,
    });

    return {
      token: {
        accessToken,
        refreshToken,
      },
      user,
    };
  }
}
