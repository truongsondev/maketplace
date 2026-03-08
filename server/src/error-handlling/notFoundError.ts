import { CustomError } from './customError';
import { ErrorCode } from '../shared/server/error-codes';

export class NotFoundError extends CustomError {
  constructor(message: string, code: string = ErrorCode.NOT_FOUND) {
    super(message, 404, code);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}
