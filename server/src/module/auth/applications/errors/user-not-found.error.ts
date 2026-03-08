import { ApplicationError } from './application.error';

export class UserNotFoundError extends ApplicationError {
  constructor() {
    super('USER_NOT_FOUND', 'User not found');
  }
}