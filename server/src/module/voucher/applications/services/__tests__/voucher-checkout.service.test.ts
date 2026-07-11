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
    countUserUsageForYear: jest.fn(async () => 0),
    countUserVoucherOrdersForYear: jest.fn(async () => 0),
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
      usageYear: null,
      tx,
    });
  });
});

describe('VoucherCheckoutService.calculateForCheckout', () => {
  it('applies promotion only to cart items inside the campaign scope', async () => {
    const repo = createRepositoryMock({
      getCartTotals: jest.fn(async () => ({
        cartId: 'cart-1',
        subtotal: 200_000,
        memberTier: 'MEMBER',
        items: [
          {
            id: 'cart-item-campaign',
            productId: 'product-campaign',
            variantId: 'variant-1',
            quantity: 1,
            unitPrice: 100_000,
            categoryIds: [],
            ancestorCategoryIds: [],
          },
          {
            id: 'cart-item-regular',
            productId: 'product-regular',
            variantId: 'variant-2',
            quantity: 1,
            unitPrice: 100_000,
            categoryIds: [],
            ancestorCategoryIds: [],
          },
        ],
      })),
    });
    const tx = {
      promotion: {
        findMany: jest.fn(async () => [
          {
            id: 'promo-campaign',
            name: 'Campaign giảm 10%',
            type: 'PERCENTAGE',
            status: 'ACTIVE',
            scopeType: 'INCLUDE_PRODUCTS',
            includeDescendants: false,
            value: 10,
            maxDiscount: null,
            priority: 1,
            usageLimit: null,
            usedCount: 0,
            stackableWithVoucher: true,
            startAt: new Date('2026-01-01T00:00:00.000Z'),
            endAt: new Date('2099-01-01T00:00:00.000Z'),
            includedProducts: [{ productId: 'product-campaign' }],
            includedCategories: [],
          },
        ]),
      },
    };
    const service = new VoucherCheckoutService(repo);

    const result = await service.calculateForCheckout({
      userId: 'user-1',
      tx: tx as never,
    });

    expect(result.subtotalAmount).toBe(200_000);
    expect(result.promotionDiscountAmount).toBe(10_000);
    expect(result.payableAmount).toBe(190_000);
    expect(result.itemDiscounts).toEqual([
      expect.objectContaining({
        cartItemId: 'cart-item-campaign',
        promotionDiscountAmount: 10_000,
      }),
      expect.objectContaining({
        cartItemId: 'cart-item-regular',
        promotionDiscountAmount: 0,
      }),
    ]);
  });

  it('allows birthday voucher on the user birthday when unused this year', async () => {
    const today = new Date();
    const repo = createRepositoryMock({
      findByCode: jest.fn(async () => ({
        ...activeVoucher,
        id: 'birthday-voucher',
        code: 'BIRTHDAY',
        value: 20_000,
        isBirthdayVoucher: true,
      })),
      getCartTotals: jest.fn(async () => ({
        cartId: 'cart-1',
        subtotal: 100_000,
        memberTier: 'MEMBER',
        userBirthday: new Date(Date.UTC(1998, today.getMonth(), today.getDate())),
        items: [
          {
            id: 'cart-item-1',
            productId: 'product-1',
            variantId: 'variant-1',
            quantity: 1,
            unitPrice: 100_000,
            categoryIds: [],
            ancestorCategoryIds: [],
          },
        ],
      })),
    });
    const tx = { promotion: { findMany: jest.fn(async () => []) } };
    const service = new VoucherCheckoutService(repo);

    const result = await service.calculateForCheckout({
      userId: 'user-1',
      voucherCode: 'BIRTHDAY',
      amount: 80_000,
      tx: tx as never,
    });

    expect(result.voucherDiscountAmount).toBe(20_000);
    expect(result.payableAmount).toBe(80_000);
    expect(repo.countUserUsageForYear).toHaveBeenCalledWith(
      'birthday-voucher',
      'user-1',
      today.getFullYear(),
      tx as never,
    );
  });

  it('rejects birthday voucher after it was used in the same year', async () => {
    const today = new Date();
    const repo = createRepositoryMock({
      findByCode: jest.fn(async () => ({
        ...activeVoucher,
        id: 'birthday-voucher',
        code: 'BIRTHDAY',
        isBirthdayVoucher: true,
      })),
      countUserUsageForYear: jest.fn(async () => 1),
      getCartTotals: jest.fn(async () => ({
        cartId: 'cart-1',
        subtotal: 100_000,
        memberTier: 'MEMBER',
        userBirthday: new Date(Date.UTC(1998, today.getMonth(), today.getDate())),
        items: [
          {
            id: 'cart-item-1',
            productId: 'product-1',
            variantId: 'variant-1',
            quantity: 1,
            unitPrice: 100_000,
            categoryIds: [],
            ancestorCategoryIds: [],
          },
        ],
      })),
    });
    const service = new VoucherCheckoutService(repo);

    await expect(
      service.calculateForCheckout({
        userId: 'user-1',
        voucherCode: 'BIRTHDAY',
        tx: { promotion: { findMany: jest.fn(async () => []) } } as never,
      }),
    ).rejects.toThrow('Voucher sinh nhật năm nay đã được sử dụng');
  });
});
