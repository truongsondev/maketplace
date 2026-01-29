import { CustomError } from './customError';

export class BadRequestError extends CustomError {
  constructor(message: string) {
    super(message, 400);
  }
}
