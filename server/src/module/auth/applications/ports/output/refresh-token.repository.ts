export interface IRefreshTokenRepository {
  create(userId: string, token: string, expiresAt: Date): Promise<void>;

  findByToken(token: string): Promise<{
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
    revoked: boolean;
  } | null>;

  revoke(token: string): Promise<void>;

  revokeAllByUserId(userId: string): Promise<void>;

  deleteExpired(): Promise<void>;
}
