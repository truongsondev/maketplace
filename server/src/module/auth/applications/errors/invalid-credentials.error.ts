import { ApplicationError } from './application.error';

/**
 * Error thrown when login credentials are invalid
 */
export class InvalidCredentialsError extends ApplicationError {
  constructor() {
    super('INVALID_CREDENTIALS', 'Tài khoản hoặc mật khẩu không đúng');
  }
}
