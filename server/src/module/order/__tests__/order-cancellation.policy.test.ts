import { describe, expect, it } from '@jest/globals';
import {
  assertUserOrderCancellationEnabled,
  withUserOrderCancellationCapability,
} from '../order-cancellation.policy';

describe('user order cancellation policy', () => {
  it('rejects cancellation while locked', () => {
    expect(() => assertUserOrderCancellationEnabled()).toThrow(
      'Chức năng hủy đơn hiện đang tạm khóa',
    );
  });

  it('adds disabled capability to an order response', () => {
    expect(withUserOrderCancellationCapability({ id: 'order-1' })).toEqual({
      id: 'order-1',
      userOrderCancellationEnabled: false,
    });
  });
});
