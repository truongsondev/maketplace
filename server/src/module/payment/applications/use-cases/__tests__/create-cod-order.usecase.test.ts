import { describe, expect, it, jest } from '@jest/globals';
import { CreateCodOrderUseCase } from '../create-cod-order.usecase';
import type { IPaymentRepository } from '../../ports/output';
import type { UserShippingInfoService } from '../../../../address/applications/services/user-shipping-info.service';
import type { INewOrderNotifier } from '../../ports/output/new-order-notifier';

describe('CreateCodOrderUseCase', () => {
  it('creates COD without a PayOS transaction code and uses the remembered address id', async () => {
    const createPendingTransaction = jest.fn(async (_input: unknown) => ({
      orderId: 'order-cod-1',
      payableAmount: 200000,
      discountAmount: 50000,
      subtotalAmount: 250000,
    }));
    const repository = { createPendingTransaction } as unknown as IPaymentRepository;
    const shippingInfo = {
      rememberAddress: jest.fn(async () => ({ id: 'address-1' })),
    } as unknown as UserShippingInfoService;
    const newOrderNotifier = {
      notify: jest.fn(async () => undefined),
    } as unknown as INewOrderNotifier;

    const result = await new CreateCodOrderUseCase(repository, shippingInfo, newOrderNotifier).execute({
      userId: 'user-1',
      amount: 1,
      cartItemIds: ['item-1'],
      shipping: {
        recipient: 'Nguyễn Văn A',
        phone: '0900 000 000',
        addressLine: '1 Đường A',
        ward: 'Phường A',
        district: 'Quận A',
        city: 'TP. Hồ Chí Minh',
      },
    });

    expect(createPendingTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentMethod: 'COD',
        shipping: expect.objectContaining({ sourceAddressId: 'address-1' }),
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        orderId: 'order-cod-1',
        paymentMethod: 'COD',
        shippingFee: 0,
        totalAmount: 200000,
      }),
    );
    expect(newOrderNotifier.notify).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: 'order-cod-1',
        orderCode: 'order-cod-1',
        customerName: 'Nguyễn Văn A',
        totalAmount: 200000,
      }),
    );
  });
});
