import { ITokenProvider, TokenPayload } from '../../applications';
import jwt from 'jsonwebtoken';
export class JwtTokenProvider implements ITokenProvider {
  private readonly privateKey: string;
  private readonly publicKey: string;
  private readonly accessTokenExpiresIn: number;
  private readonly refreshTokenExpiresIn: number;

  constructor(config?: {
    privateKey?: string;
    publicKey?: string;
    accessTokenExpiresIn?: number;
    refreshTokenExpiresIn?: number;
  }) {
    this.privateKey = (
      config?.privateKey ?? process.env.JWT_PRIVATE_KEY
    )?.replace(/\\n/g, '\n')!;
    this.publicKey = (config?.publicKey ?? process.env.JWT_PUBLIC_KEY)?.replace(
      /\\n/g,
      '\n',
    )!;

    this.accessTokenExpiresIn = config?.accessTokenExpiresIn ?? 15 * 60;
    this.refreshTokenExpiresIn =
      config?.refreshTokenExpiresIn ?? 7 * 24 * 60 * 60;
  }
  getAccessTokenExpiresIn(): number {
    return this.accessTokenExpiresIn;
  }
  getRefreshTokenExpiresAt(): Date {
    return new Date(Date.now() + this.refreshTokenExpiresIn * 1000);
  }

  generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.privateKey, {
      algorithm: 'RS256',
      expiresIn: this.accessTokenExpiresIn,
    });
  }

  generateRefreshToken(): string {
    return jwt.sign({}, this.privateKey, {
      algorithm: 'RS256',
      expiresIn: this.refreshTokenExpiresIn,
    });
  }

  verifyAccessToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, this.publicKey, {
        algorithms: ['RS256'],
      }) as TokenPayload;
    } catch {
      return null;
    }
  }
}
