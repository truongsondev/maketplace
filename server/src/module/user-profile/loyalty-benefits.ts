export type LoyaltyTier = 'MEMBER' | 'SILVER' | 'GOLD';

export const LOYALTY_TIER_BENEFITS: Record<
  LoyaltyTier,
  {
    label: string;
    discountPercent: number;
    birthdayVoucherLabel: string;
  }
> = {
  MEMBER: {
    label: 'Thành viên',
    discountPercent: 0,
    birthdayVoucherLabel: 'Voucher sinh nhật cơ bản',
  },
  SILVER: {
    label: 'Bạc',
    discountPercent: 2,
    birthdayVoucherLabel: 'Voucher sinh nhật hạng Bạc',
  },
  GOLD: {
    label: 'Vàng',
    discountPercent: 5,
    birthdayVoucherLabel: 'Voucher sinh nhật hạng Vàng',
  },
};

export function normalizeLoyaltyTier(tier: string | null | undefined): LoyaltyTier {
  if (tier === 'SILVER' || tier === 'GOLD') return tier;
  return 'MEMBER';
}

export function getLoyaltyTierBenefit(tier: string | null | undefined) {
  return LOYALTY_TIER_BENEFITS[normalizeLoyaltyTier(tier)];
}

export function calculateLoyaltyDiscount(params: {
  tier: string | null | undefined;
  amount: number;
}): {
  tier: LoyaltyTier;
  tierLabel: string;
  discountPercent: number;
  discountAmount: number;
} {
  const tier = normalizeLoyaltyTier(params.tier);
  const benefit = LOYALTY_TIER_BENEFITS[tier];
  return {
    tier,
    tierLabel: benefit.label,
    discountPercent: 0,
    discountAmount: 0,
  };
}
