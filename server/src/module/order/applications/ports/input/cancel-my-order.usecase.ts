import type { CancelMyOrderResult } from '../../dto/order.dto';

export interface ICancelMyOrderUseCase {
  execute(userId: string, orderId: string): Promise<CancelMyOrderResult>;
}
