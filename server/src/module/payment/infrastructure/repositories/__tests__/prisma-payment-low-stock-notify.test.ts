import { describe, expect, it, jest } from '@jest/globals';
import { PrismaPaymentRepository } from '../prisma-payment.repository';

describe('PrismaPaymentRepository low-stock notification', () => {
  function buildRepository(params: { previousStockOnHand: number; minStock: number }) {
    const tx = {
      paymentTransaction: {
        findUnique: jest.fn(async () => ({
          orderId: 'order-1',
          status: 'PENDING',
          rawPayload: { checkout: { cartItemIds: [] } },
          order: { userId: 'user-1' },
        })),
        updateMany: jest.fn(async () => ({ count: 1 })),
      },
      payment: {
        update: jest.fn(async () => ({})),
      },
      order: {
        updateMany: jest.fn(async () => ({ count: 1 })),
        findUnique: jest.fn(async () => ({ userId: 'user-1' })),
      },
      orderItem: {
        findMany: jest.fn(async () => [{ variantId: 'variant-1', quantity: 2 }]),
      },
      productVariant: {
        findUnique: jest.fn(async () => ({
          stockOnHand: params.previousStockOnHand,
          stockAvailable: params.previousStockOnHand,
          stockReserved: 2,
          minStock: params.minStock,
          sku: 'SKU-LOW-1',
          product: {
            id: 'product-1',
            name: 'Ao so mi test',
          },
        })),
        updateMany: jest.fn(async () => ({ count: 1 })),
        update: jest.fn(async () => ({})),
      },
      cartItem: {
        deleteMany: jest.fn(async () => ({ count: 0 })),
      },
      auditLog: {
        create: jest.fn(async () => ({})),
      },
    };

    const prisma = {
      $transaction: jest.fn(async (fn: (ctx: typeof tx) => Promise<boolean>) => fn(tx)),
    };

    const voucherCheckoutService = {
      recordUsageForPaidOrder: jest.fn(async () => undefined),
    };

    const lowStockProcessor = {
      process: jest.fn(async () => true),
    };

    const repository = new PrismaPaymentRepository(
      prisma as any,
      voucherCheckoutService as any,
      lowStockProcessor as any,
    );

    return {
      repository,
      lowStockProcessor,
    };
  }

  it('calls low-stock processor when stock crosses threshold after PAID webhook', async () => {
    const { repository, lowStockProcessor } = buildRepository({
      previousStockOnHand: 8,
      minStock: 6,
    });

    const updated = await repository.updateFromWebhookIfPending({
      orderCode: '20260001',
      status: 'PAID',
      paymentLinkId: 'plink-1',
      gatewayReference: 'ref-1',
      gatewayCode: '00',
      bankCode: 'VCB',
      paidAt: new Date('2026-04-20T10:00:00.000Z'),
      rawPayload: { test: true },
    });

    expect(updated).toBe(true);
    expect(lowStockProcessor.process).toHaveBeenCalledTimes(1);
  });

  it('does not call low-stock processor when stock was already below threshold', async () => {
    const { repository, lowStockProcessor } = buildRepository({
      previousStockOnHand: 4,
      minStock: 6,
    });

    const updated = await repository.updateFromWebhookIfPending({
      orderCode: '20260002',
      status: 'PAID',
      paymentLinkId: 'plink-2',
      gatewayReference: 'ref-2',
      gatewayCode: '00',
      bankCode: 'VCB',
      paidAt: new Date('2026-04-20T10:05:00.000Z'),
      rawPayload: { test: true },
    });

    expect(updated).toBe(true);
    expect(lowStockProcessor.process).not.toHaveBeenCalled();
  });
});
