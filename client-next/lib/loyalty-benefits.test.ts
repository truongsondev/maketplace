import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateLoyaltyDiscount } from './loyalty-benefits.ts';

test('checkout fallback preserves tier metadata without applying a tier discount', () => {
  assert.deepEqual(
    calculateLoyaltyDiscount({ tier: 'GOLD', amount: 1_000_000 }),
    {
      tier: 'GOLD',
      tierLabel: 'Vàng',
      discountPercent: 0,
      discountAmount: 0,
    },
  );
});
