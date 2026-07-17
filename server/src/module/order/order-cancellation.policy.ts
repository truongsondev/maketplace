import { BadRequestError } from '../../error-handlling/badRequestError';

export const USER_ORDER_CANCELLATION_ENABLED = false;

export function assertUserOrderCancellationEnabled(): void {
  if (!USER_ORDER_CANCELLATION_ENABLED) {
    throw new BadRequestError('Chức năng hủy đơn hiện đang tạm khóa');
  }
}

export function withUserOrderCancellationCapability<T extends object>(value: T) {
  return {
    ...value,
    userOrderCancellationEnabled: USER_ORDER_CANCELLATION_ENABLED,
  };
}
