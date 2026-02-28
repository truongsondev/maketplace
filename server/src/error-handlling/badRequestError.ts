import { CustomError } from './customError';
import { ErrorCode } from '../shared/server/error-codes';

export class BadRequestError extends CustomError {
  constructor(message: string, code: string = ErrorCode.VALIDATION_ERROR) {
    super(message, 400, code);
    Object.setPrototypeOf(this, BadRequestError.prototype);
  }
}
