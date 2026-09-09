import Redis from 'ioredis';

class RedisService {
  private static instance: RedisService;
  private redis: Redis;

  private constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      connectTimeout: 10000,
      lazyConnect: true,
    });

    this.redis.on('connect', () => {
      console.log('✅ Redis connected successfully');
    });

    this.redis.on('error', (error) => {
      console.error('❌ Redis connection error:', error);
    });

    this.redis.on('close', () => {
      console.log('🔌 Redis connection closed');
    });
  }

  public static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }

  public getClient(): Redis {
    return this.redis;
  }

  public async disconnect(): Promise<void> {
    await this.redis.disconnect();
  }

  public async ping(): Promise<string> {
    return await this.redis.ping();
  }

  public async isConnected(): Promise<boolean> {
    try {
      await this.ping();
      return true;
    } catch {
      return false;
    }
  }
}

export const redisService = RedisService.getInstance();
export const redis = redisService.getClient();