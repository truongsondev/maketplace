import { ApplicationError } from './application.error';

/**
 * Error thrown when user account is not active (suspended or banned)
 */
export class UserNotActiveError extends ApplicationError {
  constructor(status: string) {
    super('USER_NOT_ACTIVE', `User account is ${status.toLowerCase()}`);
  }
}
