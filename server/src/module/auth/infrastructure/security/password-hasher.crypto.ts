import crypto from 'crypto';
import { PasswordHasher } from '../../applications/interfaces/password-hasher.interface';

export class CryptoPasswordHasher implements PasswordHasher {
  private readonly iterations = 100_000;
  private readonly keyLength = 32;
  private readonly digest = 'sha256';

  async hash(raw: string): Promise<string> {
    const salt = crypto.randomBytes(16).toString('hex');
    const derived = await this.derive(raw, salt);
    return `${salt}:${derived}`;
  }

  async compare(raw: string, hash: string): Promise<boolean> {
    const [salt, stored] = hash.split(':');
    if (!salt || !stored) {
      return false;
    }
    const derived = await this.derive(raw, salt);
    return crypto.timingSafeEqual(
      Buffer.from(stored, 'hex'),
      Buffer.from(derived, 'hex'),
    );
  }

  private derive(raw: string, salt: string): Promise<string> {
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(
        raw,
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
