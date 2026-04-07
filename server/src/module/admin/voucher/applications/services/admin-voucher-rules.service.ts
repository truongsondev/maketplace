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

    const startAt = new Date(input.startAt);
    const endAt = new Date(input.endAt);
    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
      throw new BadRequestError('Invalid startAt or endAt');
    }

    if (startAt >= endAt) {
      throw new BadRequestError('endAt must be greater than startAt');
    }

    const maxDiscount =
      input.maxDiscount !== undefined && input.maxDiscount !== null ? input.maxDiscount : null;

    if (input.type === 'PERCENTAGE' && (!maxDiscount || maxDiscount <= 0)) {
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
      description: input.description?.trim() || null,
      type: input.type,
      value: input.value,
      maxDiscount,
      minOrderAmount:
        input.minOrderAmount !== undefined && input.minOrderAmount !== null
          ? input.minOrderAmount
          : null,
      maxUsage: input.maxUsage ?? null,
      userUsageLimit: input.userUsageLimit ?? null,
      startAt,
      endAt,
      isActive: input.isActive ?? true,
      bannerImageUrl: input.bannerImageUrl?.trim() || null,
    };
  }
}
