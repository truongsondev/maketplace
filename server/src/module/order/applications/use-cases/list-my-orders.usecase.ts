import type { IListMyOrdersUseCase } from '../ports/input';
import type { IOrderRepository } from '../ports/output/order.repository';
import type { ListMyOrdersResult, OrderListQuery } from '../dto/order.dto';

export class ListMyOrdersUseCase implements IListMyOrdersUseCase {
  constructor(private readonly orderRepository: IOrderRepository) {}

  execute(userId: string, query: OrderListQuery): Promise<ListMyOrdersResult> {
    return this.orderRepository.listMyOrders({ userId, ...query });
  }
}
