import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { HandleVnpayIpnUseCase } from '../handle-vnpay-ipn.usecase';
import type { IPaymentRepository } from '../../ports/output';
import { signVnpParams } from '../../../infrastructure/vnpay/vnpay.utils';

function buildSignedIpnQuery(overrides?: Record<string, string>): Record<string, string> {
  const base = {
    vnp_Amount: '10000000',
    vnp_ResponseCode: '00',
    vnp_TransactionStatus: '00',
    vnp_TmnCode: '2QXUI4J4',
    vnp_TxnRef: '20260322000111',
    vnp_TransactionNo: '14519001',
    vnp_BankCode: 'NCB',
    ...overrides,
  };

  const signature = signVnpParams(base, process.env.VNPAY_HASH_SECRET || 'SECRET_KEY');
  return {
    ...base,
    vnp_SecureHash: signature,
  };
}

describe('HandleVnpayIpnUseCase', () => {
  beforeEach(() => {
    process.env.VNPAY_TMN_CODE = '2QXUI4J4';
    process.env.VNPAY_HASH_SECRET = 'SECRET_KEY';
    process.env.VNPAY_PAYMENT_URL = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    process.env.VNPAY_RETURN_URL = 'https://example.com/payment/vnpay/return';
    process.env.VNPAY_IPN_URL = 'https://example.com/api/payments/vnpay/ipn';
  });

  it('should process IPN successfully', async () => {
    const repository: IPaymentRepository = {
      createPendingTransaction: jest.fn(async () => ({ orderId: 'order-1' })),
      existsByOrderCode: jest.fn(async () => false),
      findByOrderCode: jest.fn(async () => ({
        orderId: 'order-1',
        orderCode: '20260322000111',
        amount: 100000,
        status: 'PENDING' as const,
        bankCode: null,
        vnpTransactionNo: null,
        vnpResponseCode: null,
        vnpTransactionStatus: null,
        paidAt: null,
      })),
      updateFromIpnIfPending: jest.fn(async () => true),
    };

    const useCase = new HandleVnpayIpnUseCase(repository);
    const result = await useCase.execute(buildSignedIpnQuery());

    expect(result).toEqual({ RspCode: '00', Message: 'Confirm Success' });
    expect(repository.updateFromIpnIfPending).toHaveBeenCalledTimes(1);
  });

  it('should return duplicate when order already confirmed', async () => {
    const repository: IPaymentRepository = {
      createPendingTransaction: jest.fn(async () => ({ orderId: 'order-1' })),
      existsByOrderCode: jest.fn(async () => false),
      findByOrderCode: jest.fn(async () => ({
        orderId: 'order-1',
        orderCode: '20260322000111',
        amount: 100000,
        status: 'PAID' as const,
        bankCode: 'NCB',
        vnpTransactionNo: '14519001',
        vnpResponseCode: '00',
        vnpTransactionStatus: '00',
        paidAt: new Date(),
      })),
      updateFromIpnIfPending: jest.fn(async () => false),
    };

    const useCase = new HandleVnpayIpnUseCase(repository);
    const result = await useCase.execute(buildSignedIpnQuery());

    expect(result).toEqual({ RspCode: '02', Message: 'Order already confirmed' });
    expect(repository.updateFromIpnIfPending).not.toHaveBeenCalled();
  });

  it('should reject when amount mismatch', async () => {
    const repository: IPaymentRepository = {
      createPendingTransaction: jest.fn(async () => ({ orderId: 'order-1' })),
      existsByOrderCode: jest.fn(async () => false),
      findByOrderCode: jest.fn(async () => ({
        orderId: 'order-1',
        orderCode: '20260322000111',
        amount: 90000,
        status: 'PENDING' as const,
        bankCode: null,
        vnpTransactionNo: null,
        vnpResponseCode: null,
        vnpTransactionStatus: null,
        paidAt: null,
      })),
      updateFromIpnIfPending: jest.fn(async () => false),
    };

    const useCase = new HandleVnpayIpnUseCase(repository);
    const result = await useCase.execute(buildSignedIpnQuery());

    expect(result).toEqual({ RspCode: '04', Message: 'invalid amount' });
  });

  it('should reject invalid signature', async () => {
    const repository: IPaymentRepository = {
      createPendingTransaction: jest.fn(async () => ({ orderId: 'order-1' })),
      existsByOrderCode: jest.fn(async () => false),
      findByOrderCode: jest.fn(async () => null),
      updateFromIpnIfPending: jest.fn(async () => false),
    };

    const useCase = new HandleVnpayIpnUseCase(repository);
    const invalidQuery = {
      ...buildSignedIpnQuery(),
      vnp_SecureHash: 'wrong-signature',
    };

    const result = await useCase.execute(invalidQuery);

    expect(result).toEqual({ RspCode: '97', Message: 'Invalid signature' });
  });
});
