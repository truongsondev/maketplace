import Redis from 'ioredis';
import { ISessionVerifier } from '../../shared/server/session-verifier';

export class RedisSessionVerifier implements ISessionVerifier {
  constructor(private readonly redisClient: Redis) {}

  async verifySession(token: string): Promise<string | null> {
    return this.redisClient.get(`session:${token}`);
  }
}
