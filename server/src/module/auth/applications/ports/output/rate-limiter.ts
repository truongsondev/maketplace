export interface IRateLimiter {
  isRateLimitExceeded(ip: string): Promise<boolean>;

  isEmailRateLimitExceeded(email: string): Promise<boolean>;

  incrementRateLimit(ip: string): Promise<void>;

  incrementEmailRateLimit(email: string): Promise<void>;
}
