import type { ListMyOrdersResult, OrderListQuery } from '../../dto/order.dto';

export interface IListMyOrdersUseCase {
  execute(userId: string, query: OrderListQuery): Promise<ListMyOrdersResult>;
}
