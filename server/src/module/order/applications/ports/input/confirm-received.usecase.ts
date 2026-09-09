import type { ConfirmReceivedResult } from '../../dto/order.dto';

export interface IConfirmReceivedUseCase {
  execute(userId: string, orderId: string): Promise<ConfirmReceivedResult>;
}
