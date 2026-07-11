import { describe, expect, it, jest } from '@jest/globals';
import type { PrismaClient } from '@/generated/prisma/client';
import { CodSettlementService } from '../cod-settlement.service';
import type { VoucherCheckoutService } from '../../../../voucher/applications/services/voucher-checkout.service';

describe('CodSettlementService', () => {
  it('collects COD and consumes reserved stock exactly once', async () => {
    const paymentUpdate = jest.fn(async () => ({ count: 1 }));
    const stockUpdate = jest.fn(async (_input: unknown) => ({ count: 1 }));
    const tx = {
      order: {
        findUnique: jest.fn(async () => ({
          status: 'SHIPPED',
          payment: { method: 'COD', status: 'PENDING' },
          items: [{ variantId: 'variant-1', quantity: 2 }],
        })),
      },
      payment: { updateMany: paymentUpdate },
      productVariant: {
        findUnique: jest.fn(async () => ({ stockOnHand: 5 })),
        updateMany: stockUpdate,
      },
      inventoryLog: { create: jest.fn(async () => ({})) },
      auditLog: { create: jest.fn(async () => ({})) },
    };
    const prisma = {
      $transaction: jest.fn(async (callback: (client: typeof tx) => Promise<boolean>) => callback(tx)),
    } as unknown as PrismaClient;
    const voucherService = {
      recordUsageForPaidOrder: jest.fn(async () => undefined),
    } as unknown as VoucherCheckoutService;
    const service = new CodSettlementService(prisma, voucherService);

    await expect(service.settleOnDelivery('order-1', 'admin-1')).resolves.toBe(true);
    expect(paymentUpdate).toHaveBeenCalledTimes(1);
    expect(stockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ stockReserved: { gte: 2 } }),
        data: expect.objectContaining({ stockOnHand: { decrement: 2 }, stockReserved: { decrement: 2 } }),
      }),
    );
  });

  it('does nothing when COD was already collected', async () => {
    const tx = {
      order: {
        findUnique: jest.fn(async () => ({
          status: 'DELIVERED',
          payment: { method: 'COD', status: 'PAID' },
          items: [],
        })),
      },
    };
    const prisma = {
      $transaction: jest.fn(async (callback: (client: typeof tx) => Promise<boolean>) => callback(tx)),
    } as unknown as PrismaClient;
    const service = new CodSettlementService(prisma, {} as VoucherCheckoutService);

    await expect(service.settleOnDelivery('order-1', 'admin-1')).resolves.toBe(false);
  });
});
