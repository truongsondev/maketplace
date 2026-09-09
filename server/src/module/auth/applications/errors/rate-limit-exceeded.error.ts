import { ApplicationError } from './application.error';

export class RateLimitExceededError extends ApplicationError {
  constructor() {
    super('RATE_LIMIT_EXCEEDED', 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau.');
  }
}
