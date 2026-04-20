import { describe, expect, it } from '@jest/globals';
import { shouldNotifyLowStock } from '../prisma-payment.repository';

describe('shouldNotifyLowStock', () => {
  it('returns true when stock crosses from above minStock to equal minStock', () => {
    expect(shouldNotifyLowStock(8, 5, 5)).toBe(true);
  });

  it('returns true when stock crosses from above minStock to below minStock', () => {
    expect(shouldNotifyLowStock(8, 4, 5)).toBe(true);
  });

  it('returns false when stock is already below threshold before update', () => {
    expect(shouldNotifyLowStock(4, 3, 5)).toBe(false);
  });

  it('returns false when stock remains above threshold', () => {
    expect(shouldNotifyLowStock(9, 7, 5)).toBe(false);
  });
});
