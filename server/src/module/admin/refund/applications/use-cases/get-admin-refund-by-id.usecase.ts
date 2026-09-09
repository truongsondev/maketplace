import { NotFoundError } from '../../../../../error-handlling/notFoundError';
import type { IAdminRefundRepository } from '../ports/output/admin-refund.repository';

export class GetAdminRefundByIdUseCase {
  constructor(private readonly repository: IAdminRefundRepository) {}

  async execute(refundId: string) {
    const refund = await this.repository.getRefundById(refundId);
    if (!refund) {
      throw new NotFoundError('Refund not found');
    }

    return refund;
  }
}
