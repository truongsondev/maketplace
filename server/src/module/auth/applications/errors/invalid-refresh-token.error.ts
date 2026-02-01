import { ApplicationError } from './application.error';

/**
 * Error thrown when refresh token is invalid or expired
 */
export class InvalidRefreshTokenError extends ApplicationError {
  constructor() {
    super('INVALID_REFRESH_TOKEN', 'Invalid or expired refresh token');
  }
}
