import type { VoucherSummary } from '../dto/voucher.dto';
import type { IListActiveVouchersUseCase } from '../ports/input/voucher.usecase';
import type { IDiscountVoucherRepository } from '../ports/output/voucher.repository';

export class ListActiveVouchersUseCase implements IListActiveVouchersUseCase {
  constructor(private readonly voucherRepository: IDiscountVoucherRepository) {}

  async execute(): Promise<VoucherSummary[]> {
    const rows = await this.voucherRepository.findActive(new Date());
    return rows.filter((row) => row.maxUsage === null || row.usedCount < row.maxUsage);
  }
}
