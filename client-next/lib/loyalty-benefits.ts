export type LoyaltyTier = "MEMBER" | "SILVER" | "GOLD";

export const LOYALTY_TIER_BENEFITS: Record<
  LoyaltyTier,
  { label: string; discountPercent: number; birthdayVoucherLabel: string }
> = {
  MEMBER: {
    label: "Thành viên",
    discountPercent: 0,
    birthdayVoucherLabel: "Voucher sinh nhật cơ bản",
  },
  SILVER: {
    label: "Bạc",
    discountPercent: 2,
    birthdayVoucherLabel: "Voucher sinh nhật hạng Bạc",
  },
  GOLD: {
    label: "Vàng",
    discountPercent: 5,
    birthdayVoucherLabel: "Voucher sinh nhật hạng Vàng",
  },
};

export function normalizeLoyaltyTier(tier?: string | null): LoyaltyTier {
  if (tier === "SILVER" || tier === "GOLD") return tier;
  return "MEMBER";
}

export function getLoyaltyBenefit(tier?: string | null) {
  return LOYALTY_TIER_BENEFITS[normalizeLoyaltyTier(tier)];
}

export function calculateLoyaltyDiscount(params: {
  tier?: string | null;
  amount: number;
}) {
  const tier = normalizeLoyaltyTier(params.tier);
  const benefit = getLoyaltyBenefit(tier);
  const amount = Math.max(0, Math.round(params.amount));
  return {
    tier,
    tierLabel: benefit.label,
    discountPercent: benefit.discountPercent,
    discountAmount: Math.min(
      amount,
      Math.floor((amount * benefit.discountPercent) / 100),
    ),
  };
}
