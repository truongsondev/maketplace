import Redis from 'ioredis';
import { ISessionVerifier } from '../../shared/server/session-verifier';

/**
 * Infrastructure implementation of ISessionVerifier using Redis.
 *
 * Session key format: session:{accessToken} → userId
 * This key is written by LoginUseCase after successful authentication.
 */
export class RedisSessionVerifier implements ISessionVerifier {
  constructor(private readonly redisClient: Redis) {}

  async verifySession(token: string): Promise<string | null> {
    return this.redisClient.get(`session:${token}`);
  }
}
