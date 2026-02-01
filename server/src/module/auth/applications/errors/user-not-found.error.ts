import { ApplicationError } from './application.error';

/**
 * Error thrown when user is not found
 */
export class UserNotFoundError extends ApplicationError {
  constructor() {
    super('USER_NOT_FOUND', 'User not found');
  }
}
