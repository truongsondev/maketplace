import { BadRequestError } from '../../../../../error-handlling/badRequestError';
import type { AdminVoucherSummary } from '../dto/admin-voucher.dto';
import type { IGetAdminVoucherByIdUseCase } from '../ports/input/admin-voucher.usecase';
import type { IAdminVoucherRepository } from '../ports/output/admin-voucher.repository';

export class GetAdminVoucherByIdUseCase implements IGetAdminVoucherByIdUseCase {
  constructor(private readonly repository: IAdminVoucherRepository) {}

  async execute(id: string): Promise<AdminVoucherSummary> {
    const voucher = await this.repository.getById(id);
    if (!voucher) {
      throw new BadRequestError('Voucher not found');
    }
    return voucher;
  }
}
