import type { MyOrderDto } from '../../dto/order.dto';

export interface IGetMyOrderDetailUseCase {
  execute(userId: string, orderId: string): Promise<MyOrderDto>;
}
