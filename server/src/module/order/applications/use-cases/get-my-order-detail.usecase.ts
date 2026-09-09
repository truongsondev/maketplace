import type { IGetMyOrderDetailUseCase } from '../ports/input';
import type { IOrderRepository } from '../ports/output/order.repository';
import type { MyOrderDto } from '../dto/order.dto';

export class GetMyOrderDetailUseCase implements IGetMyOrderDetailUseCase {
  constructor(private readonly orderRepository: IOrderRepository) {}

  execute(userId: string, orderId: string): Promise<MyOrderDto> {
    return this.orderRepository.getMyOrderDetail({ userId, orderId });
  }
}
