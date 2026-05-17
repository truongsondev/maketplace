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
});
