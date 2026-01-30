/**
 * Output Port - OTP Generator
 * Defines the contract for generating OTP codes
 */
export interface IOtpGenerator {
  /**
   * Generate a random OTP code
   * @param length - Length of the OTP code (default: 6)
   * @returns Generated OTP code as string
   */
  generate(length?: number): string;
}
