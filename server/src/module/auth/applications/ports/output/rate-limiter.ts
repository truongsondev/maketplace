export interface IRateLimiter {
  /**
   * Check rate limit for registration by IP
   * @param ip IP address
   * @returns true if rate limit exceeded
   */
  isRegisterRateLimitExceeded(ip: string): Promise<boolean>;

  /**
   * Check rate limit for registration by email
   * @param email Email address
   * @returns true if rate limit exceeded
   */
  isRegisterEmailRateLimitExceeded(email: string): Promise<boolean>;

  /**
   * Increment rate limit counter for registration by IP
   * @param ip IP address
   */
  incrementRegisterRateLimit(ip: string): Promise<void>;

  /**
   * Increment rate limit counter for registration by email
   * @param email Email address
   */
  incrementRegisterEmailRateLimit(email: string): Promise<void>;
}