import { BadRequestError } from '../../../../error-handlling/badRequestError';
import type { UserShippingInfoService } from '../../../address/applications/services/user-shipping-info.service';
import type { CreateCodOrderCommand, CreateCodOrderResult } from '../dto';
import type { IPaymentRepository } from '../ports/output';
import type { INewOrderNotifier } from '../ports/output/new-order-notifier';
import { assertCodPaymentEnabled } from '../../payment-method.policy';

export class CreateCodOrderUseCase {
  constructor(
    private readonly paymentRepository: IPaymentRepository,
    private readonly shippingInfoService: UserShippingInfoService,
    private readonly newOrderNotifier: INewOrderNotifier,
  ) {}

  async execute(command: CreateCodOrderCommand): Promise<CreateCodOrderResult> {
    assertCodPaymentEnabled();

    if (!Number.isFinite(command.amount) || command.amount <= 0) {
      throw new BadRequestError('amount must be greater than 0');
    }

    const fields = ['recipient', 'phone', 'addressLine', 'ward', 'district', 'city'] as const;
    for (const field of fields) {
      if (!command.shipping[field]?.trim()) {
        throw new BadRequestError(`shipping.${field} is required`);
      }
    }

    const rememberedAddress = await this.shippingInfoService.rememberAddress(command.userId, {
      recipient: command.shipping.recipient,
      phone: command.shipping.phone,
      addressLine: command.shipping.addressLine,
      ward: command.shipping.ward,
      district: command.shipping.district,
      city: command.shipping.city,
      ghnProvinceId: command.shipping.ghnProvinceId,
      ghnDistrictId: command.shipping.ghnDistrictId,
      ghnWardCode: command.shipping.ghnWardCode,
    });

    const result = await this.paymentRepository.createPendingTransaction({
      userId: command.userId,
      amount: Math.round(command.amount),
      paymentMethod: 'COD',
      voucherCode: command.voucherCode,
      cartItemIds: command.cartItemIds,
      shipping: {
        recipientName: command.shipping.recipient.trim(),
        phone: command.shipping.phone.replace(/\s+/g, '').trim(),
        addressLine: command.shipping.addressLine.trim(),
        ward: command.shipping.ward.trim(),
        district: command.shipping.district.trim(),
        city: command.shipping.city.trim(),
        sourceAddressId: rememberedAddress.id,
        ghnProvinceId: command.shipping.ghnProvinceId ?? null,
        ghnDistrictId: command.shipping.ghnDistrictId ?? null,
        ghnWardCode: command.shipping.ghnWardCode?.trim() || null,
      },
    });

    await this.newOrderNotifier.notify({
      orderId: result.orderId,
      orderCode: result.orderId,
      customerName: command.shipping.recipient.trim(),
      totalAmount: result.payableAmount,
      createdAt: new Date(),
    });

    return {
      orderId: result.orderId,
      paymentMethod: 'COD',
      paymentStatus: 'PENDING',
      subtotalAmount: result.subtotalAmount,
      discountAmount: result.discountAmount,
      shippingFee: 0,
      totalAmount: result.payableAmount,
    };
  }
}
