export interface ITokenProvider {
  generateAccessToken(payload: TokenPayload): string;

  generateRefreshToken(): string;

  verifyAccessToken(token: string): TokenPayload | null;

  getAccessTokenExpiresIn(): number;

  getRefreshTokenExpiresAt(): Date;
}

export interface TokenPayload {
  userId: string;
  email?: string;
  phone?: string;
  roles: string[];
}
