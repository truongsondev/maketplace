import { CustomError } from './customError';
import { ErrorCode } from '../shared/server/error-codes';

export class ForbiddenError extends CustomError {
  constructor(message: string, code: string = ErrorCode.FORBIDDEN) {
    super(message, 403, code);
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}
