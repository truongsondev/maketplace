import { ApplicationError } from './application.error';

/**
 * Error thrown when attempting to register with an email that already exists
 */
export class EmailAlreadyExistsError extends ApplicationError {
  constructor() {
    super('EMAIL_ALREADY_EXISTS', 'Email already exists');
  }
}
