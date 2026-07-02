import { describe, expect, it, jest } from '@jest/globals';
import { BadRequestError } from '@/error-handlling/badRequestError';
import { VoucherCheckoutService } from '../voucher-checkout.service';
import type { IDiscountVoucherRepository } from '../../ports/output/voucher.repository';

function createRepositoryMock(
  overrides: Partial<IDiscountVoucherRepository> = {},
): IDiscountVoucherRepository {
  return {
    findActive: jest.fn(async () => []),
    findByCode: jest.fn(async () => null),
    countUserUsage: jest.fn(async () => 0),
    getCartTotals: jest.fn(async () => {
      throw new Error('not implemented');
    }),
    getOrderVoucher: jest.fn(async () => null),
    hasDiscountUsage: jest.fn(async () => false),
    createDiscountUsage: jest.fn(async () => undefined),
    incrementUsedCountIfAvailable: jest.fn(async () => true),
    ...overrides,
  };
}

const activeVoucher = {
  id: 'discount-1',
  code: 'SAVE10',
  description: null,
  type: 'FIXED_AMOUNT' as const,
  value: 10_000,
  maxDiscount: null,
  minOrderAmount: null,
  maxUsage: 1,
  userUsageLimit: 1,
  usedCount: 0,
  startAt: new Date('2026-01-01T00:00:00.000Z'),
  endAt: new Date('2099-01-01T00:00:00.000Z'),
  isActive: true,
  bannerImageUrl: null,
};

describe('VoucherCheckoutService.recordUsageForPaidOrder', () => {
  it('is idempotent when usage already exists for the order', async () => {
    const repo = createRepositoryMock({
      getOrderVoucher: jest.fn(async () => ({
        discountId: 'discount-1',
        userId: 'user-1',
        discount: activeVoucher,
      })),
      hasDiscountUsage: jest.fn(async () => true),
    });
    const service = new VoucherCheckoutService(repo);

    await service.recordUsageForPaidOrder({} as never, 'order-1');

    expect(repo.incrementUsedCountIfAvailable).not.toHaveBeenCalled();
    expect(repo.createDiscountUsage).not.toHaveBeenCalled();
  });

  it('fails without creating usage when voucher quota is exhausted at paid time', async () => {
    const repo = createRepositoryMock({
      getOrderVoucher: jest.fn(async () => ({
        discountId: 'discount-1',
        userId: 'user-1',
        discount: activeVoucher,
      })),
      incrementUsedCountIfAvailable: jest.fn(async () => false),
    });
    const service = new VoucherCheckoutService(repo);

    await expect(service.recordUsageForPaidOrder({} as never, 'order-1')).rejects.toBeInstanceOf(
      BadRequestError,
    );

    expect(repo.createDiscountUsage).not.toHaveBeenCalled();
  });

  it('increments quota before creating usage for a paid order', async () => {
    const tx = {} as never;
    const repo = createRepositoryMock({
      getOrderVoucher: jest.fn(async () => ({
        discountId: 'discount-1',
        userId: 'user-1',
        discount: activeVoucher,
      })),
    });
    const service = new VoucherCheckoutService(repo);

    await service.recordUsageForPaidOrder(tx, 'order-1');

    expect(repo.incrementUsedCountIfAvailable).toHaveBeenCalledWith('discount-1', tx);
    expect(repo.createDiscountUsage).toHaveBeenCalledWith({
      discountId: 'discount-1',
      userId: 'user-1',
      orderId: 'order-1',
      tx,
    });
  });
});
