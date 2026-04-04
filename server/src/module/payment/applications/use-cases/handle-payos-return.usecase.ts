import { BadRequestError } from '../../../../error-handlling/badRequestError';
import { createLogger } from '../../../../shared/util/logger';
import { PayosReturnResult } from '../dto';
import { IPaymentRepository } from '../ports/output';
import { getPayosClient } from '../../infrastructure/payos/payos.client';

const logger = createLogger('HandlePayosReturnUseCase');

export class HandlePayosReturnUseCase {
  constructor(private readonly paymentRepository: IPaymentRepository) {}

  async execute(orderCode: string): Promise<PayosReturnResult> {
    if (!/^\d+$/.test(orderCode)) {
      throw new BadRequestError('orderCode must be numeric');
    }

    const payos = getPayosClient();
    const paymentLink = await payos.paymentRequests.get(Number(orderCode));
    const payment = await this.paymentRepository.findByOrderCode(orderCode);

    // Safety net: if PayOS already confirms PAID but webhook hasn't updated DB yet,
    // reconcile the DB status using PayOS server-to-server lookup.
    if (paymentLink.status === 'PAID' && payment?.status === 'PENDING') {
      const paidAt = (() => {
        const raw = (paymentLink as any)?.transactionDateTime;
        if (typeof raw === 'string' && raw.trim()) {
          const parsed = new Date(raw);
          if (!Number.isNaN(parsed.getTime())) {
            return parsed;
          }
        }
        return new Date();
      })();

      const updated = await this.paymentRepository.updateFromWebhookIfPending({
        orderCode,
        status: 'PAID',
        paymentLinkId: paymentLink.id ?? null,
        gatewayReference: (paymentLink as any)?.reference ?? null,
        gatewayCode: '00',
        bankCode: (paymentLink as any)?.counterAccountBankId ?? null,
        paidAt,
        rawPayload: {
          source: 'return-reconcile',
          paymentLink,
        },
      });

      logger.info('PayOS return reconcile attempted', {
        orderCode,
        gatewayStatus: paymentLink.status,
        dbStatus: payment.status,
        updated,
      });
    }

    const refreshedPayment = await this.paymentRepository.findByOrderCode(orderCode);

    return {
      orderCode,
      amount: paymentLink.amount,
      amountPaid: paymentLink.amountPaid,
      amountRemaining: paymentLink.amountRemaining,
      paymentLinkId: paymentLink.id,
      gatewayStatus: paymentLink.status,
      dbStatus: refreshedPayment?.status,
      message: this.resolveMessage(paymentLink.status),
    };
  }

  private resolveMessage(status: string): string {
    switch (status) {
      case 'PAID':
        return 'Thanh toan thanh cong';
      case 'FAILED':
      case 'CANCELLED':
      case 'EXPIRED':
        return 'Thanh toan that bai hoac da bi huy';
      default:
        return 'Dang cho cap nhat trang thai thanh toan';
    }
  }
}
