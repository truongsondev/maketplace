import { NotFoundError } from '../../../../error-handlling/notFoundError';
import { PaymentStatusResult } from '../dto';
import { IPaymentRepository } from '../ports/output';

export class GetPaymentStatusUseCase {
  constructor(private readonly paymentRepository: IPaymentRepository) {}

  async execute(orderCode: string): Promise<PaymentStatusResult> {
    const payment = await this.paymentRepository.findByOrderCode(orderCode);
    if (!payment) {
      throw new NotFoundError('Payment transaction not found');
    }

    return {
      orderId: payment.orderId,
      orderCode: payment.orderCode,
      amount: payment.amount,
      status: payment.status,
      bankCode: payment.bankCode ?? undefined,
      gatewayReference: payment.gatewayReference ?? undefined,
      gatewayCode: payment.gatewayCode ?? undefined,
      paidAt: payment.paidAt?.toISOString(),
    };
  }
}
