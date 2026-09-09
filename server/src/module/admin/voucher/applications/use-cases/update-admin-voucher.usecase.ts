import type { AdminVoucherInput, AdminVoucherSummary } from '../dto/admin-voucher.dto';
import type { IUpdateAdminVoucherUseCase } from '../ports/input/admin-voucher.usecase';
import type { IAdminVoucherRepository } from '../ports/output/admin-voucher.repository';
import { AdminVoucherRulesService } from '../services/admin-voucher-rules.service';

export class UpdateAdminVoucherUseCase implements IUpdateAdminVoucherUseCase {
  constructor(private readonly repository: IAdminVoucherRepository) {}

  async execute(id: string, input: AdminVoucherInput): Promise<AdminVoucherSummary> {
    const normalized = AdminVoucherRulesService.normalizeInput(input);
    return this.repository.update(id, normalized);
  }
}
