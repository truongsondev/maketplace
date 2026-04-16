import type { ICancelMyOrderUseCase } from '../ports/input';
import type { IOrderRepository } from '../ports/output/order.repository';
import type { CancelMyOrderResult } from '../dto/order.dto';

export class CancelMyOrderUseCase implements ICancelMyOrderUseCase {
  constructor(private readonly orderRepository: IOrderRepository) {}

  execute(userId: string, orderId: string): Promise<CancelMyOrderResult> {
    return this.orderRepository.cancelMyOrder({ userId, orderId });
  }
}
