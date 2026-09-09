import { describe, expect, it, jest } from '@jest/globals';
import { HandlePayosReturnUseCase } from '../handle-payos-return.usecase';
import type {
  IPaymentRepository,
  PaymentTransactionRecord,
} from '../../ports/output/payment.repository';
import type { IPaymentSuccessNotifier } from '../../ports/output/payment-success-notifier';

function paymentRecord(
  overrides: Partial<PaymentTransactionRecord>,
): PaymentTransactionRecord {
  return {
    orderId: 'order-1',
    orderCode: '20260001',
    amount: 500000,
    status: 'PENDING',
    bankCode: null,
    gatewayReference: null,
    gatewayCode: null,
    paidAt: null,
    ...overrides,
  };
}

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

    const findByOrderCode = jest
      .fn<IPaymentRepository['findByOrderCode']>()
      .mockResolvedValueOnce(
        paymentRecord({
          orderId: 'order-1',
          orderCode: '20260001',
          amount: 500000,
          status: 'PENDING',
        }),
      )
      .mockResolvedValueOnce(
        paymentRecord({
          orderId: 'order-1',
          orderCode: '20260001',
          amount: 500000,
          status: 'PAID',
          paidAt: new Date('2026-04-20T10:00:00.000Z'),
        }),
      )
      .mockResolvedValueOnce(
        paymentRecord({
          orderId: 'order-1',
          orderCode: '20260001',
          amount: 500000,
          status: 'PAID',
          paidAt: new Date('2026-04-20T10:00:00.000Z'),
        }),
      );
    const paymentRepository = {
      findByOrderCode,
      updateFromWebhookIfPending: jest.fn(async () => true),
    } as Partial<IPaymentRepository> as IPaymentRepository;

    const notifier = {
      notify: jest.fn(async () => undefined),
    } satisfies IPaymentSuccessNotifier;

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

    const findByOrderCode = jest
      .fn<IPaymentRepository['findByOrderCode']>()
      .mockResolvedValueOnce(
        paymentRecord({
          orderId: 'order-2',
          orderCode: '20260002',
          amount: 300000,
          status: 'PENDING',
        }),
      )
      .mockResolvedValueOnce(
        paymentRecord({
          orderId: 'order-2',
          orderCode: '20260002',
          amount: 300000,
          status: 'PENDING',
        }),
      );
    const paymentRepository = {
      findByOrderCode,
      updateFromWebhookIfPending: jest.fn(async () => false),
    } as Partial<IPaymentRepository> as IPaymentRepository;

    const notifier = {
      notify: jest.fn(async () => undefined),
    } satisfies IPaymentSuccessNotifier;

    const useCase = new HandlePayosReturnUseCase(paymentRepository, notifier, getPaymentLink);

    await useCase.execute('20260002');

    expect(notifier.notify).not.toHaveBeenCalled();
  });
});
