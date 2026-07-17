import { describe, expect, it } from '@jest/globals';
import { calculateLoyaltyDiscount } from '../loyalty-benefits';

describe('calculateLoyaltyDiscount', () => {
  it.each([
    ['SILVER', 'Bạc'],
    ['GOLD', 'Vàng'],
  ])(
    'keeps %s metadata but applies no checkout discount',
    (tier, tierLabel) => {
      expect(calculateLoyaltyDiscount({ tier, amount: 1_000_000 })).toEqual({
        tier,
        tierLabel,
        discountPercent: 0,
        discountAmount: 0,
      });
    },
  );
});
