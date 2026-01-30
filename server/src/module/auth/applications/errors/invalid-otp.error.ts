import { ApplicationError } from './application.error';

/**
 * Error thrown when OTP is invalid or expired
 */
export class InvalidOtpError extends ApplicationError {
  constructor() {
    super('Invalid or expired OTP code');
    this.name = 'InvalidOtpError';
  }
}
