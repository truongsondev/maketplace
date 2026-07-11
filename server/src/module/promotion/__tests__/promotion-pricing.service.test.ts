import { describe, expect, it, jest } from '@jest/globals';
import { PromotionPricingService } from '../promotion-pricing.service';

const item = {
  id: 'cart-item-1',
  productId: 'product-1',
  variantId: 'variant-1',
  quantity: 2,
  unitPrice: 100000,
  categoryIds: ['category-1'],
  ancestorCategoryIds: [],
};

describe('PromotionPricingService', () => {
  it('applies the best automatic promotion for an eligible item', async () => {
    const tx = {
      promotion: {
        findMany: jest.fn(async () => [
          {
            id: 'promo-1',
            name: 'Giảm 10%',
            type: 'PERCENTAGE',
            status: 'ACTIVE',
            scopeType: 'ALL_PRODUCTS',
            includeDescendants: false,
            value: 10,
            maxDiscount: null,
            priority: 1,
            usageLimit: null,
            usedCount: 0,
            stackableWithVoucher: true,
            startAt: new Date(Date.now() - 1000),
            endAt: new Date(Date.now() + 1000),
            includedProducts: [],
            includedCategories: [],
          },
          {
            id: 'promo-2',
            name: 'Giảm 50K',
            type: 'FIXED_AMOUNT',
            status: 'ACTIVE',
            scopeType: 'INCLUDE_PRODUCTS',
            includeDescendants: false,
            value: 50000,
            maxDiscount: null,
            priority: 0,
            usageLimit: null,
            usedCount: 0,
            stackableWithVoucher: false,
            startAt: new Date(Date.now() - 1000),
            endAt: new Date(Date.now() + 1000),
            includedProducts: [{ productId: 'product-1' }],
            includedCategories: [],
          },
        ]),
      },
    };

    const result = await new PromotionPricingService().calculateForCart({
      tx: tx as never,
      items: [item],
    });

    expect(result.totalDiscount).toBe(50000);
    expect(result.allocations[0]).toEqual(
      expect.objectContaining({
        promotionId: 'promo-2',
        discountAmount: 50000,
        stackableWithVoucher: false,
      }),
    );
  });

  it('does not apply category promotion outside its scope', async () => {
    const tx = {
      promotion: {
        findMany: jest.fn(async () => [
          {
            id: 'promo-category',
            name: 'Danh mục khác',
            type: 'PERCENTAGE',
            status: 'ACTIVE',
            scopeType: 'INCLUDE_CATEGORIES',
            includeDescendants: false,
            value: 50,
            maxDiscount: null,
            priority: 1,
            usageLimit: null,
            usedCount: 0,
            stackableWithVoucher: true,
            startAt: new Date(Date.now() - 1000),
            endAt: new Date(Date.now() + 1000),
            includedProducts: [],
            includedCategories: [{ categoryId: 'category-other' }],
          },
        ]),
      },
    };

    const result = await new PromotionPricingService().calculateForCart({
      tx: tx as never,
      items: [item],
    });

    expect(result.totalDiscount).toBe(0);
    expect(result.allocations[0]?.promotionId).toBeNull();
  });
});
