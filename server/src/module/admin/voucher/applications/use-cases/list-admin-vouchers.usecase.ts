import type { AdminVoucherSummary } from '../dto/admin-voucher.dto';
import type { IListAdminVouchersUseCase } from '../ports/input/admin-voucher.usecase';
import type { IAdminVoucherRepository } from '../ports/output/admin-voucher.repository';

export class ListAdminVouchersUseCase implements IListAdminVouchersUseCase {
  constructor(private readonly repository: IAdminVoucherRepository) {}

  execute(params: {
    page: number;
    limit: number;
    search?: string;
    isActive?: boolean;
  }): Promise<{ items: AdminVoucherSummary[]; total: number }> {
    return this.repository.list(params);
  }
}
