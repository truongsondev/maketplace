import type { ListAdminRefundsCommand } from '../dto/admin-refund.dto';
import type { IAdminRefundRepository } from '../ports/output/admin-refund.repository';

export class ListAdminRefundsUseCase {
  constructor(private readonly repository: IAdminRefundRepository) {}

  execute(command: ListAdminRefundsCommand) {
    return this.repository.listRefunds(command);
  }
}
