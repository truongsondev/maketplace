export interface PasswordResetToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface IPasswordResetTokenRepository {
  save(token: PasswordResetToken): Promise<void>;

  findByTokenHash(tokenHash: string): Promise<PasswordResetToken | null>;

  deleteByTokenHash(tokenHash: string): Promise<void>;

  deleteByUserId(userId: string): Promise<void>;
}
