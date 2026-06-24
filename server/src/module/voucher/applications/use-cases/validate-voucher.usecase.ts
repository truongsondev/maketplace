import { BadRequestError } from '../../../../error-handlling/badRequestError';
import type { ValidateVoucherCommand, VoucherValidationResult } from '../dto/voucher.dto';
import type { IValidateVoucherUseCase } from '../ports/input/voucher.usecase';
import type { IDiscountVoucherRepository } from '../ports/output/voucher.repository';
import { VoucherRulesService } from '../services/voucher-rules.service';

export class ValidateVoucherUseCase implements IValidateVoucherUseCase {
  constructor(private readonly voucherRepository: IDiscountVoucherRepository) {}

  async execute(command: ValidateVoucherCommand): Promise<VoucherValidationResult> {
    const code = command.code.trim();
    if (!code) {
      throw new BadRequestError('Mã voucher là bắt buộc');
    }

    const cartTotals = await this.voucherRepository.getCartTotals(
      command.userId,
      command.cartItemIds,
    );
    const voucher = await this.voucherRepository.findByCode(code);

    if (!voucher) {
      throw new BadRequestError('Voucher không áp dụng được cho đơn hàng này');
    }

    VoucherRulesService.ensureVoucherIsApplicable(voucher, cartTotals.subtotal);

    const userUsageCount = await this.voucherRepository.countUserUsage(voucher.id, command.userId);
    if (voucher.userUsageLimit !== null && userUsageCount >= voucher.userUsageLimit) {
      throw new BadRequestError('Voucher đã đạt giới hạn sử dụng cho người dùng này');
    }

    return {
      voucher,
      pricing: VoucherRulesService.calculatePrice(voucher.type, voucher.value, {
        subtotal: cartTotals.subtotal,
        maxDiscount: voucher.maxDiscount,
      }),
    };
  }
}
