export interface EmailVerificationToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface IEmailVerificationTokenRepository {
  save(token: EmailVerificationToken): Promise<void>;

  findByTokenHash(tokenHash: string): Promise<EmailVerificationToken | null>;

  deleteByTokenHash(tokenHash: string): Promise<void>;

  deleteExpiredTokens(): Promise<void>;
}
