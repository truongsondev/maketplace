import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { CreateVnpayPaymentUrlUseCase } from '../create-vnpay-payment-url.usecase';
import type { IPaymentRepository } from '../../ports/output';

describe('CreateVnpayPaymentUrlUseCase', () => {
  beforeEach(() => {
    process.env.VNPAY_TMN_CODE = '2QXUI4J4';
    process.env.VNPAY_HASH_SECRET = 'SECRET_KEY';
    process.env.VNPAY_PAYMENT_URL = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    process.env.VNPAY_RETURN_URL = 'https://example.com/payment/vnpay/return';
    process.env.VNPAY_IPN_URL = 'https://example.com/api/payments/vnpay/ipn';
  });

  it('should create signed payment url successfully', async () => {
    const repository: IPaymentRepository = {
      createPendingTransaction: jest.fn(async () => ({ orderId: 'order-1' })),
      existsByOrderCode: jest.fn(async () => false),
      findByOrderCode: jest.fn(async () => null),
      updateFromIpnIfPending: jest.fn(async () => true),
    };

    const useCase = new CreateVnpayPaymentUrlUseCase(repository);

    const result = await useCase.execute(
      {
        userId: 'user-1',
        amount: 150000,
        locale: 'vn',
        orderType: 'fashion',
        orderInfo: 'Order_20260322',
      },
      '127.0.0.1',
    );

    expect(result.orderId).toBe('order-1');
    expect(result.orderCode).toMatch(/^\d{14}$/);
    expect(result.paymentUrl).toContain('https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?');
    expect(result.paymentUrl).toContain('vnp_Amount=15000000');
    expect(result.paymentUrl).toContain('vnp_SecureHash=');
    expect(repository.createPendingTransaction).toHaveBeenCalledTimes(1);
  });
});
