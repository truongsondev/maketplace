import type { IRequestPaidCancelUseCase } from '../ports/input';
import type { IOrderRepository } from '../ports/output/order.repository';
import type { RequestPaidCancelCommand, RequestPaidCancelResult } from '../dto/order.dto';

export class RequestPaidCancelUseCase implements IRequestPaidCancelUseCase {
  constructor(private readonly orderRepository: IOrderRepository) {}

  execute(userId: string, command: RequestPaidCancelCommand): Promise<RequestPaidCancelResult> {
    return this.orderRepository.requestPaidCancel({ userId, ...command });
  }
}
