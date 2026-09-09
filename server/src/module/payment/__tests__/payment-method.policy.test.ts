import { describe, expect, it } from '@jest/globals';
import { BadRequestError } from '../../../error-handlling/badRequestError';
import {
  COD_PAYMENT_ENABLED,
  assertCodPaymentEnabled,
  getPaymentMethodCapabilities,
} from '../payment-method.policy';

describe('payment method policy', () => {
  it('disables COD and rejects new COD payments', () => {
    expect(COD_PAYMENT_ENABLED).toBe(false);
    expect(getPaymentMethodCapabilities()).toEqual({ codEnabled: false });
    expect(assertCodPaymentEnabled).toThrow(BadRequestError);
    expect(assertCodPaymentEnabled).toThrow('Thanh toán khi nhận hàng đang tạm ngừng');
  });
});
