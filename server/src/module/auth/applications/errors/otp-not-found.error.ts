import { ApplicationError } from './application.error';

/**
 * Error thrown when OTP has not been initiated for an email
 */
export class OtpNotFoundError extends ApplicationError {
  constructor() {
    super('No OTP found for this email. Please initiate registration first.');
    this.name = 'OtpNotFoundError';
  }
}
