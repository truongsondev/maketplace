import { ApplicationError } from './application.error';

/**
 * Error thrown when too many OTP attempts have been made
 */
export class TooManyOtpAttemptsError extends ApplicationError {
  constructor() {
    super('Too many OTP verification attempts. Please request a new code.');
    this.name = 'TooManyOtpAttemptsError';
  }
}
