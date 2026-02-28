import Redis from 'ioredis';
import { IRedisCache } from '../../applications/ports/output/redis-cache';

export class RedisCache implements IRedisCache {
  constructor(private readonly redisClient: Redis) {}

  async set(key: string, value: string, expireSeconds?: number): Promise<void> {
    if (expireSeconds) {
      await this.redisClient.setex(key, expireSeconds, value);
    } else {
      await this.redisClient.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return this.redisClient.get(key);
  }
}
