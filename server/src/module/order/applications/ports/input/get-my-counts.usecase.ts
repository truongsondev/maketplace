import type { MyOrderCountsResult } from '../../dto/order.dto';

export interface IGetMyOrderCountsUseCase {
  execute(userId: string): Promise<MyOrderCountsResult>;
}
