import { VoucherRulesService } from '../voucher-rules.service';
import type { CartItemPricing, VoucherSummary } from '../../dto/voucher.dto';

const item: CartItemPricing = { id: 'line-1', productId: 'product-1', variantId: 'variant-1', quantity: 1, unitPrice: 100000, categoryIds: ['child'], ancestorCategoryIds: ['parent'] };
const base: VoucherSummary = { id: 'voucher', code: 'TEST', description: null, type: 'FIXED_AMOUNT', value: 10000, maxDiscount: null, minOrderAmount: null, maxUsage: null, userUsageLimit: null, usedCount: 0, startAt: new Date(Date.now() - 1000), endAt: new Date(Date.now() + 1000), isActive: true, bannerImageUrl: null, scopeType: 'ALL_PRODUCTS', includeDescendants: false, minAmountBasis: 'ELIGIBLE_SUBTOTAL', includedCategoryIds: [], excludedCategoryIds: [], includedProductIds: [], excludedProductIds: [], memberTiers: [] };

describe('VoucherRulesService targeting', () => {
  it('does not apply a category voucher outside its scope', () => {
    expect(VoucherRulesService.isItemEligible({ ...base, scopeType: 'INCLUDE_CATEGORIES', includedCategoryIds: ['other'] }, item, 'MEMBER')).toBe(false);
  });
  it('includes a child category only when includeDescendants is enabled', () => {
    const voucher = { ...base, scopeType: 'INCLUDE_CATEGORIES' as const, includedCategoryIds: ['parent'] };
    expect(VoucherRulesService.isItemEligible(voucher, item, 'MEMBER')).toBe(false);
    expect(VoucherRulesService.isItemEligible({ ...voucher, includeDescendants: true }, item, 'MEMBER')).toBe(true);
  });
  it('gives exclusions precedence over inclusions', () => {
    expect(VoucherRulesService.isItemEligible({ ...base, includedProductIds: ['product-1'], excludedProductIds: ['product-1'] }, item, 'MEMBER')).toBe(false);
  });
});
