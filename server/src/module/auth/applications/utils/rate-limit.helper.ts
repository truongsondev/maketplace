import { IRateLimiter } from '../ports';
import { RateLimitExceededError } from '../errors';

/**
 * Helper class for rate limiting operations in auth module
 */
export class RateLimitHelper {
  constructor(private readonly rateLimiter: IRateLimiter) {}
  async checkRateLimit(email: string, ipAddress?: string): Promise<void> {
    // Check IP rate limit
    if (ipAddress) {
      const isIpLimited = await this.rateLimiter.isRateLimitExceeded(ipAddress);
      if (isIpLimited) {
        throw new RateLimitExceededError();
      }
      await this.rateLimiter.incrementRateLimit(ipAddress);
    }

    // Check email rate limit
    const isEmailLimited = await this.rateLimiter.isEmailRateLimitExceeded(email);
    if (isEmailLimited) {
      throw new RateLimitExceededError();
    }
    await this.rateLimiter.incrementEmailRateLimit(email);
  }
}
