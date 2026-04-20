import { describe, expect, it, jest } from '@jest/globals';
import { HandlePayosReturnUseCase } from '../handle-payos-return.usecase';

describe('HandlePayosReturnUseCase', () => {
  it('notifies admin when return-reconcile marks payment PAID', async () => {
    const getPaymentLink = jest.fn(async () => ({
      amount: 500000,
      amountPaid: 500000,
      amountRemaining: 0,
      id: 'plink-1',
      status: 'PAID',
      transactionDateTime: '2026-04-20T10:00:00.000Z',
    }));

    const paymentRepository = {
      findByOrderCode: jest
        .fn()
        .mockResolvedValueOnce({
          orderId: 'order-1',
          orderCode: '20260001',
          amount: 500000,
          status: 'PENDING',
          paidAt: null,
        })
        .mockResolvedValueOnce({
          orderId: 'order-1',
          orderCode: '20260001',
          amount: 500000,
          status: 'PAID',
          paidAt: new Date('2026-04-20T10:00:00.000Z'),
        })
        .mockResolvedValueOnce({
          orderId: 'order-1',
          orderCode: '20260001',
          amount: 500000,
          status: 'PAID',
          paidAt: new Date('2026-04-20T10:00:00.000Z'),
        }),
      updateFromWebhookIfPending: jest.fn(async () => true),
    } as any;

    const notifier = {
      notify: jest.fn(async () => undefined),
    } as any;

    const useCase = new HandlePayosReturnUseCase(paymentRepository, notifier, getPaymentLink);

    const result = await useCase.execute('20260001');

    expect(result.dbStatus).toBe('PAID');
    expect(paymentRepository.updateFromWebhookIfPending).toHaveBeenCalledTimes(1);
    expect(notifier.notify).toHaveBeenCalledTimes(1);
  });

  it('does not notify when reconcile does not update pending record', async () => {
    const getPaymentLink = jest.fn(async () => ({
      amount: 300000,
      amountPaid: 300000,
      amountRemaining: 0,
      id: 'plink-2',
      status: 'PAID',
      transactionDateTime: '2026-04-20T11:00:00.000Z',
    }));

    const paymentRepository = {
      findByOrderCode: jest
        .fn()
        .mockResolvedValueOnce({
          orderId: 'order-2',
          orderCode: '20260002',
          amount: 300000,
          status: 'PENDING',
          paidAt: null,
        })
        .mockResolvedValueOnce({
          orderId: 'order-2',
          orderCode: '20260002',
          amount: 300000,
          status: 'PENDING',
          paidAt: null,
        }),
      updateFromWebhookIfPending: jest.fn(async () => false),
    } as any;

    const notifier = {
      notify: jest.fn(async () => undefined),
    } as any;

    const useCase = new HandlePayosReturnUseCase(paymentRepository, notifier, getPaymentLink);

    await useCase.execute('20260002');

    expect(notifier.notify).not.toHaveBeenCalled();
  });
});
