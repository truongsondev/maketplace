import argon2 from 'argon2';
import { IPasswordHasher } from '../../applications/ports/output/password-hasher';

export class CryptoPasswordHasher implements IPasswordHasher {
  async hash(plainPassword: string): Promise<string> {
    try {
      return await argon2.hash(plainPassword, {
        type: argon2.argon2id,
        memoryCost: 65536,
        timeCost: 3,
        parallelism: 4,
      });
    } catch (error) {
      throw new Error('Failed to hash password');
    }
  }

  async compare(plainPassword: string, hashedPassword: string): Promise<boolean> {
    try {
      return await argon2.verify(hashedPassword, plainPassword);
    } catch (error) {
      return false;
    }
  }
}
