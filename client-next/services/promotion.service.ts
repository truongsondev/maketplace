import { apiClient } from '@/lib/api-client';
import type { ApiSuccessResponse, ApiErrorResponse } from '@/types/api.types';

export type PromotionCampaign = {
  id: string; name: string; slug: string; title: string; subtitle: string | null;
  description: string | null; bannerImageUrl: string | null; mobileBannerImageUrl: string | null;
  campaignType: 'FLASH_SALE' | 'HOLIDAY' | 'CUSTOMER_APPRECIATION' | 'SEASONAL' | 'CUSTOM';
  status: 'ACTIVE' | 'SCHEDULED'; startAt: string; endAt: string; displayPriority: number; isFeatured: boolean;
  ctaLabel: string | null; ctaUrl: string | null; type: string; value: number; stackableWithVoucher: boolean;
};

export type PromotionProduct = { id: string; name: string; imageUrl: string | null; originalPrice: number; salePrice: number; promotionName: string };

async function unwrap<T>(path: string): Promise<T> {
  const response = await apiClient.get<T>(path);
  if (response.success) return (response as ApiSuccessResponse<T>).data;
  throw response as ApiErrorResponse;
}

export const promotionService = {
  getActive: () => unwrap<{ items: PromotionCampaign[] }>('api/promotions/active').then((data) => data.items),
  getBySlug: (slug: string) => unwrap<PromotionCampaign>(`api/promotions/${encodeURIComponent(slug)}`),
  getProducts: (slug: string) => unwrap<{ promotion: PromotionCampaign; products: PromotionProduct[]; pagination: { page: number; limit: number; total: number } }>(`api/promotions/${encodeURIComponent(slug)}/products`),
};
