import type { IAdminRefundRepository } from '../ports/output/admin-refund.repository';

export class RetryAdminRefundUseCase {
  constructor(private readonly repository: IAdminRefundRepository) {}

  execute(params: { refundId: string; actorAdminId: string }) {
    return this.repository.retryRefund(params);
  }
}
