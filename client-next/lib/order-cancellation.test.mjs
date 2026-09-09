import assert from 'node:assert/strict';
import test from 'node:test';
import { getUserOrderCancellationActions } from './order-cancellation.mjs';

test('hides both actions when backend capability is false', () => {
  assert.deepEqual(
    getUserOrderCancellationActions({
      status: 'PENDING',
      userOrderCancellationEnabled: false,
      payment: { status: 'PENDING', transactionStatus: 'PENDING' },
      cancelRequest: null,
    }),
    { canCancel: false, canRequestPaidCancel: false },
  );
});

test('allows paid cancellation request when capability is true', () => {
  assert.deepEqual(
    getUserOrderCancellationActions({
      status: 'PAID',
      userOrderCancellationEnabled: true,
      payment: { status: 'PAID', transactionStatus: 'PAID' },
      cancelRequest: null,
    }),
    { canCancel: false, canRequestPaidCancel: true },
  );
});
