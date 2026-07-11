import { apiClient } from '@/lib/api-client';
import type { ApiSuccessResponse } from '@/types/api.types';

export interface LoyaltySummary {
  balance: number;
  tier: string;
  tierLabel?: string;
  lifetimePoints?: number;
  nextTier?: {
    tier: string;
    label: string;
    requiredPoints: number;
  } | null;
  pointsToNextTier?: number;
  benefits?: {
    memberDiscountPercent: number;
    memberDiscountAppliesAt: "CHECKOUT";
    birthdayVoucher: {
      included: boolean;
      label: string;
      appearsIn: string[];
      note: string;
    };
  };
  transactions: Array<{
    id: string;
    type: string;
    points: number;
    balanceAfter: number;
    description: string | null;
    expiresAt: string | null;
    createdAt: string;
  }>;
}

export async function getMyLoyalty(): Promise<LoyaltySummary> {
  const response = await apiClient.get<LoyaltySummary>('api/users/me/loyalty');
  if (!response.success) throw response;
  return (response as ApiSuccessResponse<LoyaltySummary>).data;
}
