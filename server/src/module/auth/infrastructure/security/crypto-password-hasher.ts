import crypto from 'crypto';
import { IPasswordHasher } from '../../applications/ports/output/password-hasher';

/**
 * Crypto-based Password Hasher implementation using PBKDF2
 */
export class CryptoPasswordHasher implements IPasswordHasher {
  private readonly iterations = 100_000;
  private readonly keyLength = 32;
  private readonly digest = 'sha256';

  async hash(plainPassword: string): Promise<string> {
    const salt = crypto.randomBytes(16).toString('hex');
    const derived = await this.derive(plainPassword, salt);
    return `${salt}:${derived}`;
  }

  async compare(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    const [salt, stored] = hashedPassword.split(':');
    if (!salt || !stored) {
      return false;
    }

    const derived = await this.derive(plainPassword, salt);

    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(stored, 'hex'),
      Buffer.from(derived, 'hex'),
    );
  }

  private derive(password: string, salt: string): Promise<string> {
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(
        password,
        salt,
        this.iterations,
        this.keyLength,
        this.digest,
        (err, key) => {
          if (err) {
            return reject(err);
          }
          resolve(key.toString('hex'));
        },
      );
    });
  }
}
