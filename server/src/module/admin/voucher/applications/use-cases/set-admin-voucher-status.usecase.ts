import type { AdminVoucherSummary } from '../dto/admin-voucher.dto';
import type { ISetAdminVoucherStatusUseCase } from '../ports/input/admin-voucher.usecase';
import type { IAdminVoucherRepository } from '../ports/output/admin-voucher.repository';

export class SetAdminVoucherStatusUseCase implements ISetAdminVoucherStatusUseCase {
  constructor(private readonly repository: IAdminVoucherRepository) {}

  execute(id: string, isActive: boolean): Promise<AdminVoucherSummary> {
    return this.repository.setStatus(id, isActive);
  }
}
