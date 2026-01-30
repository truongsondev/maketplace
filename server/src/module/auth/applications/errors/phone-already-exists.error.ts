import { ApplicationError } from './application.error';

/**
 * Error thrown when attempting to register with a phone that already exists
 */
export class PhoneAlreadyExistsError extends ApplicationError {
  constructor() {
    super('PHONE_ALREADY_EXISTS', 'Phone number already exists');
  }
}
