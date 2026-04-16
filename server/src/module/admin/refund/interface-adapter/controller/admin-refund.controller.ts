import type { ListAdminRefundsCommand } from '../../applications/dto/admin-refund.dto';
import { GetAdminRefundByIdUseCase } from '../../applications/use-cases/get-admin-refund-by-id.usecase';
import { ListAdminRefundsUseCase } from '../../applications/use-cases/list-admin-refunds.usecase';
import { RetryAdminRefundUseCase } from '../../applications/use-cases/retry-admin-refund.usecase';

export class AdminRefundController {
  constructor(
    private readonly listAdminRefundsUseCase: ListAdminRefundsUseCase,
    private readonly getAdminRefundByIdUseCase: GetAdminRefundByIdUseCase,
    private readonly retryAdminRefundUseCase: RetryAdminRefundUseCase,
  ) {}

  listRefunds(command: ListAdminRefundsCommand) {
    return this.listAdminRefundsUseCase.execute(command);
  }

  getRefundById(refundId: string) {
    return this.getAdminRefundByIdUseCase.execute(refundId);
  }

  retryRefund(params: { refundId: string; actorAdminId: string }) {
    return this.retryAdminRefundUseCase.execute(params);
  }
}
