export interface EmailVerificationToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface IEmailVerificationTokenRepository {
  /**
   * Save email verification token
   */
  save(token: EmailVerificationToken): Promise<void>;

  /**
   * Find token by hash
   */
  findByTokenHash(tokenHash: string): Promise<EmailVerificationToken | null>;

  /**
   * Delete token by hash
   */
  deleteByTokenHash(tokenHash: string): Promise<void>;

  /**
   * Delete expired tokens
   */
  deleteExpiredTokens(): Promise<void>;
}