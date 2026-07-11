import { describe, expect, it, jest } from '@jest/globals';
import { awardLoyaltyForOrder } from '../loyalty.service';

describe('awardLoyaltyForOrder', () => {
  it('awards points with an idempotency key', async () => {
    const create = jest.fn(async (_input: unknown) => ({}));
    const tx = {
      order: {
        findUnique: jest.fn(async () => ({
          userId: 'user-1',
          totalPrice: 250000,
          grandTotal: 250000,
          status: 'COMPLETED',
          payment: { status: 'PAID' },
        })),
      },
      loyaltyConfig: {
        upsert: jest.fn(async () => ({
          spendPerPoint: 10000,
          pointValidityDays: 365,
          silverMinPoints: 1000,
          goldMinPoints: 5000,
          isActive: true,
        })),
      },
      loyaltyAccount: {
        upsert: jest.fn(async () => ({ id: 'account-1', balance: 5 })),
        findUniqueOrThrow: jest.fn(async () => ({ id: 'account-1', balance: 5 })),
        updateMany: jest.fn(async () => ({ count: 1 })),
        update: jest.fn(async () => ({})),
      },
      loyaltyTransaction: {
        aggregate: jest.fn(async () => ({ _sum: { points: 25 } })),
        findUnique: jest.fn(async () => null),
        create,
      },
    };
    await expect(awardLoyaltyForOrder(tx as never, 'order-1')).resolves.toBe(25);
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ idempotencyKey: 'ORDER:order-1:EARN', balanceAfter: 30 }) }));
  });
});
