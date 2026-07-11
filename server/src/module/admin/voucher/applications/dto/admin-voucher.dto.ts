import type { DiscountType, VoucherMinAmountBasis, VoucherScopeType } from '@/generated/prisma/enums';

export interface AdminVoucherSummary {
  id: string;
  code: string;
  description: string | null;
  type: DiscountType;
  value: number;
  maxDiscount: number | null;
  minOrderAmount: number | null;
  maxUsage: number | null;
  userUsageLimit: number | null;
  usedCount: number;
  startAt: Date;
  endAt: Date;
  isActive: boolean;
  isBirthdayVoucher?: boolean;
  bannerImageUrl: string | null;
  scopeType: VoucherScopeType;
  includeDescendants: boolean;
  minAmountBasis: VoucherMinAmountBasis;
  includedCategoryIds: string[];
  excludedCategoryIds: string[];
  includedProductIds: string[];
  excludedProductIds: string[];
  memberTiers: string[];
}

export interface AdminVoucherInput {
  code: string;
  description?: string | null;
  type: DiscountType;
  value: number;
  maxDiscount?: number | null;
  minOrderAmount?: number | null;
  maxUsage?: number | null;
  userUsageLimit?: number | null;
  startAt: string;
  endAt: string;
  isActive?: boolean;
  bannerImageUrl?: string | null;
  scopeType?: VoucherScopeType;
  includeDescendants?: boolean;
  minAmountBasis?: VoucherMinAmountBasis;
  includedCategoryIds?: string[];
  excludedCategoryIds?: string[];
  includedProductIds?: string[];
  excludedProductIds?: string[];
  memberTiers?: string[];
}

export interface NormalizedAdminVoucherInput {
  code: string;
  description: string | null;
  type: DiscountType;
  value: number;
  maxDiscount: number | null;
  minOrderAmount: number | null;
  maxUsage: number | null;
  userUsageLimit: number | null;
  startAt: Date;
  endAt: Date;
  isActive: boolean;
  bannerImageUrl: string | null;
  scopeType: VoucherScopeType;
  includeDescendants: boolean;
  minAmountBasis: VoucherMinAmountBasis;
  includedCategoryIds: string[];
  excludedCategoryIds: string[];
  includedProductIds: string[];
  excludedProductIds: string[];
  memberTiers: string[];
}
