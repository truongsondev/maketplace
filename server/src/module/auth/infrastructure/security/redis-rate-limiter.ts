import Redis from 'ioredis';
import { IRateLimiter } from '../../applications/ports/output';

export class RedisRateLimiter implements IRateLimiter {
  private readonly REGISTER_IP_PREFIX = 'register:ip:';
  private readonly REGISTER_EMAIL_PREFIX = 'register:email:';
  private readonly RATE_LIMIT = 5; 
  private readonly WINDOW_SECONDS = 60;

  constructor(private readonly redis: Redis) {}

  async isRegisterRateLimitExceeded(ip: string): Promise<boolean> {
    const key = `${this.REGISTER_IP_PREFIX}${ip}`;
    const count = await this.redis.get(key);
    return count ? parseInt(count, 10) >= this.RATE_LIMIT : false;
  }

  async isRegisterEmailRateLimitExceeded(email: string): Promise<boolean> {
    const key = `${this.REGISTER_EMAIL_PREFIX}${email}`;
    const count = await this.redis.get(key);
    return count ? parseInt(count, 10) >= this.RATE_LIMIT : false;
  }

  async incrementRegisterRateLimit(ip: string): Promise<void> {
    const key = `${this.REGISTER_IP_PREFIX}${ip}`;
    const count = await this.redis.incr(key);
    
    if (count === 1) {
      await this.redis.expire(key, this.WINDOW_SECONDS);
    }
  }

  async incrementRegisterEmailRateLimit(email: string): Promise<void> {
    const key = `${this.REGISTER_EMAIL_PREFIX}${email}`;
    const count = await this.redis.incr(key);
    
    if (count === 1) {
      await this.redis.expire(key, this.WINDOW_SECONDS);
    }
  }
}