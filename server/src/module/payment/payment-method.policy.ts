import { BadRequestError } from '../../error-handlling/badRequestError';

export const COD_PAYMENT_ENABLED = false;

export function assertCodPaymentEnabled(): void {
  if (!COD_PAYMENT_ENABLED) {
    throw new BadRequestError('Thanh toán khi nhận hàng đang tạm ngừng');
  }
}

export function getPaymentMethodCapabilities(): { codEnabled: boolean } {
  return { codEnabled: COD_PAYMENT_ENABLED };
}
