import { describe, expect, it, jest } from '@jest/globals';
import type { PrismaClient } from '@/generated/prisma/client';
import { PrismaOrderRepository } from '../prisma-order.repository';

describe('PrismaOrderRepository ownership', () => {
  it('scopes order detail lookup by order id and user id', async () => {
    const findFirst = jest.fn(async (_args: unknown) => null);
    const prisma = {
      order: {
        findFirst,
      },
    } as unknown as PrismaClient;
    const repository = new PrismaOrderRepository(prisma);

    await expect(
      repository.getMyOrderDetail({ userId: 'user-2', orderId: 'order-owned-by-user-1' }),
    ).rejects.toThrow('Order not found');

    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'order-owned-by-user-1',
          userId: 'user-2',
        },
      }),
    );
  });

  it('returns the order snapshot instead of a later profile address', async () => {
    const orderSnapshot = {
      sourceAddressId: 'address-a',
      recipientName: 'Nguyễn Văn A',
      phone: '0900000000',
      addressLine: '1 Đường A',
      ward: 'Phường A',
      district: 'Quận A',
      city: 'TP. Hồ Chí Minh',
      snapshotSource: 'CHECKOUT',
    };
    const laterProfileAddress = { addressLine: '99 Đường B' };
    const prisma = {
      order: {
        findFirst: jest.fn(async () => ({
          id: 'order-1',
          createdAt: new Date('2026-07-10T00:00:00.000Z'),
          status: 'PENDING',
          returnStatus: null,
          totalPrice: 250000,
          shippingAddress: orderSnapshot,
          payment: null,
          paymentTransaction: null,
          cancelRequest: null,
          refundTransactions: [],
          items: [],
        })),
      },
      auditLog: { findFirst: jest.fn(async () => null) },
      orderStatusHistory: { findFirst: jest.fn(async () => null) },
      userAddress: { findFirst: jest.fn(async () => laterProfileAddress) },
    } as unknown as PrismaClient;

    const result = await new PrismaOrderRepository(prisma).getMyOrderDetail({
      userId: 'user-1',
      orderId: 'order-1',
    });

    expect(result.shipping?.addressLine).toBe('1 Đường A');
    expect(result.shipping?.source).toBe('CHECKOUT');
    expect(result.shipping?.addressLine).not.toBe(laterProfileAddress.addressLine);
    expect((prisma.userAddress.findFirst as ReturnType<typeof jest.fn>)).not.toHaveBeenCalled();
  });
});
