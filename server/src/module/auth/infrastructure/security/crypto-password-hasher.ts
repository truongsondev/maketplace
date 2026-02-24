import argon2 from 'argon2';
import { IPasswordHasher } from '../../applications/ports/output/password-hasher';

/**
 * Argon2id-based Password Hasher implementation
 * Using Argon2id which is the recommended variant for password hashing
 */
export class CryptoPasswordHasher implements IPasswordHasher {
  async hash(plainPassword: string): Promise<string> {
    try {
      // Use Argon2id with default options (secure by default)
      return await argon2.hash(plainPassword, {
        type: argon2.argon2id,
        memoryCost: 65536, // 64 MB
        timeCost: 3,       // 3 iterations
        parallelism: 4,    // 4 parallel threads
      });
    } catch (error) {
      throw new Error('Failed to hash password');
    }
  }

  async compare(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    try {
      return await argon2.verify(hashedPassword, plainPassword);
    } catch (error) {
      return false;
    }
  }
}
