import { randomBytes, createHash } from 'crypto';
import { ITokenGenerator } from '../../applications/ports/output';

export class CryptoTokenGenerator implements ITokenGenerator {
  generateRandomToken(bytes: number = 32): string {
    return randomBytes(bytes).toString('hex');
  }

  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}