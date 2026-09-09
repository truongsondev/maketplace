import { CustomError } from './customError';

export class UnauthorizedError extends CustomError {
  statusCode = 401;

  constructor(public message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }

  serializeErrors() {
    return [{ message: this.message }];
  }
}
