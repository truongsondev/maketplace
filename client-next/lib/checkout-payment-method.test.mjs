import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getEffectiveCheckoutPaymentMethod,
  isCodPaymentCapabilityEnabled,
} from './checkout-payment-method.mjs';

test('enables COD only for a current successful capability query', () => {
  assert.equal(
    isCodPaymentCapabilityEnabled({
      data: { codEnabled: true },
      isSuccess: true,
      isError: false,
      isFetching: false,
    }),
    true,
  );

  for (const query of [
    { data: { codEnabled: true }, isSuccess: false, isError: false, isFetching: true },
    { data: { codEnabled: true }, isSuccess: true, isError: false, isFetching: true },
    { data: { codEnabled: true }, isSuccess: false, isError: true, isFetching: false },
    { data: { codEnabled: false }, isSuccess: true, isError: false, isFetching: false },
  ]) {
    assert.equal(isCodPaymentCapabilityEnabled(query), false);
  }
});

test('falls back to PayOS when a selected COD method is not currently enabled', () => {
  assert.equal(getEffectiveCheckoutPaymentMethod('COD', false), 'PAYOS');
  assert.equal(getEffectiveCheckoutPaymentMethod('COD', true), 'COD');
  assert.equal(getEffectiveCheckoutPaymentMethod('PAYOS', true), 'PAYOS');
});
