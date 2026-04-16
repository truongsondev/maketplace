import type { IConfirmReceivedUseCase } from '../ports/input';
import type { IOrderRepository } from '../ports/output/order.repository';
import type { ConfirmReceivedResult } from '../dto/order.dto';

export class ConfirmReceivedUseCase implements IConfirmReceivedUseCase {
  constructor(private readonly orderRepository: IOrderRepository) {}

  execute(userId: string, orderId: string): Promise<ConfirmReceivedResult> {
    return this.orderRepository.confirmReceived({ userId, orderId });
  }
}
