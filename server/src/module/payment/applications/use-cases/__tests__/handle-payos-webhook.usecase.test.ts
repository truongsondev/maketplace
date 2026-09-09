import { describe, expect, it, jest } from '@jest/globals';
import { HandlePayosWebhookUseCase } from '../handle-payos-webhook.usecase';

describe('HandlePayosWebhookUseCase', () => {
  it('should notify admin only once for duplicate PAID webhook callbacks', async () => {
    let webhookCallCount = 0;
    const paymentRepository = {
      createPendingTransaction: jest.fn(),
      existsByOrderCode: jest.fn(),
      findByOrderCode: jest.fn(async () => ({
        orderId: 'order-1',
        orderCode: '123456',
        amount: 500000,
        status: 'PAID',
        bankCode: null,
        gatewayReference: null,
        gatewayCode: null,
        paidAt: new Date('2026-04-19T10:00:00.000Z'),
      })),
      setCheckoutReference: jest.fn(),
      markCreateLinkFailed: jest.fn(),
      updateFromWebhookIfPending: jest.fn(async () => {
        webhookCallCount += 1;
        return webhookCallCount === 1;
      }),
    } as any;

    const paymentSuccessNotifier = {
      notify: jest.fn(async () => undefined),
    };

    const verifyWebhook = jest.fn(async () => ({
      orderCode: '123456',
      code: '00',
      paymentLinkId: 'plink-1',
      reference: 'ref-1',
      counterAccountBankId: 'bank-1',
      transactionDateTime: '2026-04-19T10:00:00.000Z',
    }));

    const useCase = new HandlePayosWebhookUseCase(
      paymentRepository,
      paymentSuccessNotifier as any,
      verifyWebhook,
    );

    await useCase.execute({ foo: 'bar' });
    await useCase.execute({ foo: 'bar' });

    expect(paymentRepository.updateFromWebhookIfPending).toHaveBeenCalledTimes(2);
    expect(paymentSuccessNotifier.notify).toHaveBeenCalledTimes(1);
  });

  it('should not break webhook processing when notifier fails', async () => {
    const paymentRepository = {
      createPendingTransaction: jest.fn(),
      existsByOrderCode: jest.fn(),
      findByOrderCode: jest.fn(async () => ({
        orderId: 'order-2',
        orderCode: '123999',
        amount: 250000,
        status: 'PAID',
        bankCode: null,
        gatewayReference: null,
        gatewayCode: null,
        paidAt: new Date('2026-04-19T11:00:00.000Z'),
      })),
      setCheckoutReference: jest.fn(),
      markCreateLinkFailed: jest.fn(),
      updateFromWebhookIfPending: jest.fn(async () => true),
    } as any;

    const paymentSuccessNotifier = {
      notify: jest.fn(async () => {
        throw new Error('rabbitmq down');
      }),
    };

    const verifyWebhook = jest.fn(async () => ({
      orderCode: '123999',
      code: '00',
      paymentLinkId: 'plink-2',
      reference: 'ref-2',
      counterAccountBankId: 'bank-2',
      transactionDateTime: '2026-04-19T11:00:00.000Z',
    }));

    const useCase = new HandlePayosWebhookUseCase(
      paymentRepository,
      paymentSuccessNotifier as any,
      verifyWebhook,
    );

    const result = await useCase.execute({});

    expect(result.processed).toBe(true);
    expect(result.orderCode).toBe('123999');
    expect(result.status).toBe('PAID');
  });
});
