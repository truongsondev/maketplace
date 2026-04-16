import type { RequestPaidCancelCommand, RequestPaidCancelResult } from '../../dto/order.dto';

export interface IRequestPaidCancelUseCase {
  execute(userId: string, command: RequestPaidCancelCommand): Promise<RequestPaidCancelResult>;
}
