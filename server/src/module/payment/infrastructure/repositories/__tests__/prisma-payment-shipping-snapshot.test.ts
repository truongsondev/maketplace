import { describe, expect, it, jest } from '@jest/globals';
import type { PrismaClient } from '@/generated/prisma/client';
import { PrismaPaymentRepository } from '../prisma-payment.repository';
import type { VoucherCheckoutService } from '../../../../voucher/applications/services/voucher-checkout.service';

describe('PrismaPaymentRepository shipping snapshot', () => {
  it('creates the immutable shipping snapshot in the order transaction', async () => {
    const orderCreate = jest.fn(async (_args: unknown) => ({ id: 'order-1' }));
    const tx = {
      cartItem: {
        findMany: jest.fn(async () => [
          {
            id: 'cart-item-1',
            productId: 'product-1',
            variantId: 'variant-1',
            quantity: 1,
            variant: { price: 250000 },
          },
        ]),
      },
      productVariant: {
        findUnique: jest.fn(async () => ({
          stockOnHand: 5,
          stockAvailable: 5,
          stockReserved: 0,
          isDeleted: false,
          sku: 'SKU-1',
          product: { isDeleted: false },
        })),
        update: jest.fn(async () => ({})),
        updateMany: jest.fn(async () => ({ count: 1 })),
      },
      inventoryLog: { create: jest.fn(async () => ({})) },
      order: { create: orderCreate },
      orderItem: { createMany: jest.fn(async () => ({ count: 1 })) },
      payment: { create: jest.fn(async () => ({})) },
      paymentTransaction: { create: jest.fn(async () => ({})) },
      auditLog: { create: jest.fn(async () => ({})) },
    };

    const prisma = {
      $transaction: jest.fn(async (callback: (client: typeof tx) => Promise<unknown>) =>
        callback(tx),
      ),
    } as unknown as PrismaClient;
    const voucherCheckoutService = {
      calculateForCheckout: jest.fn(async () => ({
        cartId: 'cart-1',
        itemIds: ['cart-item-1'],
        subtotalAmount: 250000,
        discountAmount: 0,
        payableAmount: 250000,
        appliedVoucherId: null,
        appliedVoucherCode: undefined,
      })),
    } as unknown as VoucherCheckoutService;

    const repository = new PrismaPaymentRepository(prisma, voucherCheckoutService, {
      process: jest.fn(async () => undefined),
    } as never);

    await repository.createPendingTransaction({
      userId: 'user-1',
      orderCode: '20260710000001',
      amount: 1,
      shipping: {
        recipientName: 'Nguyễn Văn A',
        phone: '0900000000',
        addressLine: '1 Đường A',
        ward: 'Phường A',
        district: 'Quận A',
        city: 'TP. Hồ Chí Minh',
        sourceAddressId: 'address-a',
        ghnProvinceId: 202,
        ghnDistrictId: 1442,
        ghnWardCode: '20101',
      },
    });

    expect(orderCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          shippingAddress: {
            create: {
              recipientName: 'Nguyễn Văn A',
              phone: '0900000000',
              addressLine: '1 Đường A',
              ward: 'Phường A',
              district: 'Quận A',
              city: 'TP. Hồ Chí Minh',
              sourceAddressId: 'address-a',
              ghnProvinceId: 202,
              ghnDistrictId: 1442,
              ghnWardCode: '20101',
              snapshotSource: 'CHECKOUT',
            },
          },
        }),
      }),
    );
  });
});
