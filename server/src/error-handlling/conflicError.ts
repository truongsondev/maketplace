import { CustomError } from './customError';
import { ErrorCode } from '../shared/server/error-codes';

export class ConflicError extends CustomError {
  constructor(message: string, code: string = ErrorCode.CONFLICT) {
    super(message, 409, code);
    Object.setPrototypeOf(this, ConflicError.prototype);
  }
}
