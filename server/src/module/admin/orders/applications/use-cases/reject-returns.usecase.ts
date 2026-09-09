import { ForbiddenError } from '../../../../../error-handlling/forbiddenError';
import type {
  AdminReturnStatusResult,
  IAdminOrderReturnRepository,
} from '../ports/output/admin-order-return.repository';

export class RejectReturnsUseCase {
  constructor(private readonly repo: IAdminOrderReturnRepository) {}

  execute(params: { orderId: string; actorId?: string }): Promise<AdminReturnStatusResult> {
    if (!params.actorId) {
      throw new ForbiddenError('Authentication required');
    }
    return this.repo.rejectReturns({ orderId: params.orderId, actorId: params.actorId });
  }
}
