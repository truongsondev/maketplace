import type { IGetMyOrderCountsUseCase } from '../ports/input';
import type { IOrderRepository } from '../ports/output/order.repository';
import type { MyOrderCountsResult } from '../dto/order.dto';

export class GetMyOrderCountsUseCase implements IGetMyOrderCountsUseCase {
  constructor(private readonly orderRepository: IOrderRepository) {}

  execute(userId: string): Promise<MyOrderCountsResult> {
    return this.orderRepository.getMyCounts(userId);
  }
}
