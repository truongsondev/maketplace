import type { DiscountType } from '@/generated/prisma/enums';

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
  bannerImageUrl: string | null;
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
}
