import { BadRequestError } from '../../../../error-handlling/badRequestError';
import { createLogger } from '../../../../shared/util/logger';
import { PayosReturnResult } from '../dto';
import { IPaymentRepository, IPaymentSuccessNotifier } from '../ports/output';
import { getPayosClient } from '../../infrastructure/payos/payos.client';

const logger = createLogger('HandlePayosReturnUseCase');

type PayosPaymentLink = {
  amount: number;
  amountPaid: number;
  amountRemaining: number;
  id: string;
  status: string;
  transactionDateTime?: string;
};

type GetPaymentLinkFn = (orderCode: number) => Promise<PayosPaymentLink>;

export class HandlePayosReturnUseCase {
  private readonly getPaymentLink: GetPaymentLinkFn;

  constructor(
    private readonly paymentRepository: IPaymentRepository,
    private readonly paymentSuccessNotifier: IPaymentSuccessNotifier,
    getPaymentLink?: GetPaymentLinkFn,
  ) {
    this.getPaymentLink =
      getPaymentLink ??
      (async (orderCode: number) =>
        (await getPayosClient().paymentRequests.get(orderCode)) as PayosPaymentLink);
  }

  async execute(orderCode: string): Promise<PayosReturnResult> {
    if (!/^\d+$/.test(orderCode)) {
      throw new BadRequestError('orderCode must be numeric');
    }

    const paymentLink = await this.getPaymentLink(Number(orderCode));
    const payment = await this.paymentRepository.findByOrderCode(orderCode);

    // Safety net: reconcile DB if webhook hasn't updated yet.
    // - PayOS confirms PAID -> mark DB PAID
    // - PayOS confirms CANCELLED/EXPIRED/FAILED -> mark DB FAILED
    if (payment?.status === 'PENDING') {
      const isPaid = paymentLink.status === 'PAID';
      const isExpired = paymentLink.status === 'EXPIRED';
      const isTerminalFailure = ['FAILED', 'CANCELLED', 'EXPIRED'].includes(paymentLink.status);

      if (isPaid || isTerminalFailure) {
        const paidAt = (() => {
          if (!isPaid) return null;

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
          status: isPaid ? 'PAID' : isExpired ? 'EXPIRED' : 'FAILED',
          paymentLinkId: paymentLink.id ?? null,
          gatewayReference: (paymentLink as any)?.reference ?? null,
          gatewayCode: isPaid ? '00' : paymentLink.status,
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

        if (updated && isPaid) {
          const refreshed = await this.paymentRepository.findByOrderCode(orderCode);
          if (refreshed && refreshed.status === 'PAID') {
            try {
              await this.paymentSuccessNotifier.notify({
                orderId: refreshed.orderId,
                orderCode: refreshed.orderCode,
                amount: refreshed.amount,
                paidAt: refreshed.paidAt ?? new Date(),
              });
            } catch (error) {
              logger.warn('Payment success notification failed in return reconcile', {
                orderCode,
                error: error instanceof Error ? error.message : String(error),
              });
            }
          }
        }
      }
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
