import type { AdminVoucherInput, AdminVoucherSummary } from '../dto/admin-voucher.dto';
import type { ICreateAdminVoucherUseCase } from '../ports/input/admin-voucher.usecase';
import type { IAdminVoucherRepository } from '../ports/output/admin-voucher.repository';
import { AdminVoucherRulesService } from '../services/admin-voucher-rules.service';

export class CreateAdminVoucherUseCase implements ICreateAdminVoucherUseCase {
  constructor(private readonly repository: IAdminVoucherRepository) {}

  async execute(input: AdminVoucherInput): Promise<AdminVoucherSummary> {
    const normalized = AdminVoucherRulesService.normalizeInput(input);
    return this.repository.create(normalized);
  }
}
