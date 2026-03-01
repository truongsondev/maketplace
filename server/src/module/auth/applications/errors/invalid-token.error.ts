import { ApplicationError } from './application.error';

export class InvalidTokenError extends ApplicationError {
  constructor() {
    super('INVALID_TOKEN', 'Invalid or expired token');
  }
}