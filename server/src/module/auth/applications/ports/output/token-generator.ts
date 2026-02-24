export interface ITokenGenerator {
  /**
   * Generate random token
   * @param bytes Number of bytes (default: 32 for 256-bit)
   * @returns Random token string
   */
  generateRandomToken(bytes?: number): string;

  /**
   * Hash token using SHA-256
   * @param token Token to hash
   * @returns Hashed token
   */
  hashToken(token: string): string;
}