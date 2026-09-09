import { describe, expect, it, jest } from '@jest/globals';
import { CreateCodOrderUseCase } from '../create-cod-order.usecase';
import type { IPaymentRepository } from '../../ports/output';
import type { UserShippingInfoService } from '../../../../address/applications/services/user-shipping-info.service';
import type { INewOrderNotifier } from '../../ports/output/new-order-notifier';

describe('CreateCodOrderUseCase', () => {
  it('rejects disabled COD before validation or dependency calls', async () => {
    const createPendingTransaction = jest.fn();
    const repository = { createPendingTransaction } as unknown as IPaymentRepository;
    const shippingInfo = {
      rememberAddress: jest.fn(),
    } as unknown as UserShippingInfoService;
    const newOrderNotifier = {
      notify: jest.fn(),
    } as unknown as INewOrderNotifier;

    const execution = new CreateCodOrderUseCase(repository, shippingInfo, newOrderNotifier).execute({
      userId: 'user-1',
      amount: 0,
      cartItemIds: ['item-1'],
      shipping: {
        recipient: '',
        phone: '',
        addressLine: '',
        ward: '',
        district: '',
        city: '',
      },
    });

    await expect(execution).rejects.toThrow('Thanh toán khi nhận hàng đang tạm ngừng');
    expect(shippingInfo.rememberAddress).not.toHaveBeenCalled();
    expect(createPendingTransaction).not.toHaveBeenCalled();
    expect(newOrderNotifier.notify).not.toHaveBeenCalled();
  });
});
