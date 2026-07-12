import { BadRequestError } from '../../../../../error-handlling/badRequestError';
import type { AdminVoucherInput, NormalizedAdminVoucherInput } from '../dto/admin-voucher.dto';

export class AdminVoucherRulesService {
  static normalizeInput(input: AdminVoucherInput): NormalizedAdminVoucherInput {
    const code = input.code.trim().toUpperCase();
    if (!code) {
      throw new BadRequestError('code is required');
    }

    if (!Number.isFinite(input.value) || input.value <= 0) {
      throw new BadRequestError('value must be greater than 0');
    }

    const isBirthdayVoucher = input.isBirthdayVoucher === true;
    const currentYear = new Date().getFullYear();
    const birthdayStartAt = new Date(currentYear, 0, 1, 0, 0, 0, 0);
    const birthdayEndAt = new Date(currentYear, 11, 30, 23, 59, 59, 999);

    const startAt = isBirthdayVoucher ? birthdayStartAt : new Date(input.startAt);
    const endAt = isBirthdayVoucher ? birthdayEndAt : new Date(input.endAt);
    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
      throw new BadRequestError('Invalid startAt or endAt');
    }

    if (startAt >= endAt) {
      throw new BadRequestError('endAt must be greater than startAt');
    }

    const maxDiscount =
      input.maxDiscount !== undefined && input.maxDiscount !== null ? input.maxDiscount : null;

    if (!isBirthdayVoucher && input.type === 'PERCENTAGE' && (!maxDiscount || maxDiscount <= 0)) {
      throw new BadRequestError('maxDiscount is required for percentage voucher');
    }

    if (input.maxUsage !== undefined && input.maxUsage !== null && input.maxUsage <= 0) {
      throw new BadRequestError('maxUsage must be greater than 0');
    }

    if (
      input.userUsageLimit !== undefined &&
      input.userUsageLimit !== null &&
      input.userUsageLimit <= 0
    ) {
      throw new BadRequestError('userUsageLimit must be greater than 0');
    }

    if (
      input.maxUsage !== undefined &&
      input.maxUsage !== null &&
      input.userUsageLimit !== undefined &&
      input.userUsageLimit !== null &&
      input.userUsageLimit > input.maxUsage
    ) {
      throw new BadRequestError('userUsageLimit cannot be greater than maxUsage');
    }

    return {
      code,
      isBirthdayVoucher,
      description: input.description?.trim() || null,
      type: isBirthdayVoucher ? 'FIXED_AMOUNT' : input.type,
      value: input.value,
      maxDiscount: isBirthdayVoucher ? null : maxDiscount,
      minOrderAmount:
        !isBirthdayVoucher && input.minOrderAmount !== undefined && input.minOrderAmount !== null
          ? input.minOrderAmount
          : null,
      maxUsage: isBirthdayVoucher ? null : input.maxUsage ?? null,
      userUsageLimit: isBirthdayVoucher ? 1 : input.userUsageLimit ?? null,
      startAt,
      endAt,
      isActive: input.isActive ?? true,
      bannerImageUrl: isBirthdayVoucher ? null : input.bannerImageUrl?.trim() || null,
      scopeType: isBirthdayVoucher ? 'ALL_PRODUCTS' : input.scopeType ?? 'ALL_PRODUCTS',
      includeDescendants: isBirthdayVoucher ? false : input.includeDescendants ?? false,
      minAmountBasis: input.minAmountBasis ?? 'ELIGIBLE_SUBTOTAL',
      includedCategoryIds: isBirthdayVoucher ? [] : [...new Set(input.includedCategoryIds ?? [])],
      excludedCategoryIds: isBirthdayVoucher ? [] : [...new Set(input.excludedCategoryIds ?? [])],
      includedProductIds: isBirthdayVoucher ? [] : [...new Set(input.includedProductIds ?? [])],
      excludedProductIds: isBirthdayVoucher ? [] : [...new Set(input.excludedProductIds ?? [])],
      memberTiers: isBirthdayVoucher ? [] : [...new Set(input.memberTiers ?? [])].filter((tier) => ['MEMBER', 'SILVER', 'GOLD'].includes(tier)),
    };
  }
}
