import { ApplicationError } from './application.error';

export class RateLimitExceededError extends ApplicationError {
  constructor() {
    super('RATE_LIMIT_EXCEEDED', 'Rate limit exceeded. Please try again later.');
  }
}