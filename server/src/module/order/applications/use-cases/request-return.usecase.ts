import { BadRequestError } from '../../../../error-handlling/badRequestError';
import type {
  IOrderReturnRepository,
  RequestReturnInput,
  RequestReturnResult,
} from '../ports/output/order-return.repository';

export class RequestReturnUseCase {
  constructor(private readonly repo: IOrderReturnRepository) {}

  async execute(input: RequestReturnInput): Promise<RequestReturnResult> {
    if (!input.userId) {
      throw new BadRequestError('User ID not found');
    }

    if (!input.orderId) {
      throw new BadRequestError('orderId is required');
    }

    return this.repo.requestReturn({
      userId: input.userId,
      orderId: input.orderId,
      reason: input.reason ?? null,
    });
  }
}
