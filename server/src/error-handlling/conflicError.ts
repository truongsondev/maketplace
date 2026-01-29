import { CustomError } from './customError';

export class ConflicError extends CustomError {
  constructor(message: string) {
    super(message, 409);
  }
}
