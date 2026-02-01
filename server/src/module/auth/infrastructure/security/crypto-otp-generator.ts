import { IOtpGenerator } from '../../applications/ports';

/**
 * Crypto-based OTP Generator implementation
 */
export class CryptoOtpGenerator implements IOtpGenerator {
  /**
   * Generate a random numeric OTP code
   * @param length - Length of the OTP code (default: 6)
   * @returns Generated OTP code as string
   */
  generate(length: number = 6): string {
    const digits = '0123456789';
    let otp = '';

    // Use crypto for secure random number generation
    const randomValues = new Uint32Array(length);
    crypto.getRandomValues(randomValues);

    for (let i = 0; i < length; i++) {
      otp += digits[randomValues[i] % 10];
    }

    return otp;
  }
}
