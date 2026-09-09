import { BadRequestError } from '../../../../error-handlling/badRequestError';
import type {
  IMockOrdersRepository,
  OrderTransitionResult,
} from '../ports/output/mock-orders.repository';

export class MarkDeliveredUseCase {
  constructor(private readonly repo: IMockOrdersRepository) {}

  async execute(orderId: string): Promise<OrderTransitionResult> {
    if (!orderId) {
      throw new BadRequestError('orderId is required');
    }

    return this.repo.markDelivered(orderId);
  }
}
