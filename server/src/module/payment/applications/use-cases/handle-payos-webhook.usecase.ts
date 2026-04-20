import { createLogger } from '../../../../shared/util/logger';
import { HandlePayosWebhookResult } from '../dto';
import { IPaymentRepository, IPaymentSuccessNotifier } from '../ports/output';
import { getPayosClient } from '../../infrastructure/payos/payos.client';

const logger = createLogger('HandlePayosWebhookUseCase');

type VerifiedPayosWebhook = {
  orderCode: string | number;
  code: string;
  paymentLinkId?: string | null;
  reference?: string | null;
  counterAccountBankId?: string | null;
  transactionDateTime?: string;
};

type VerifyWebhookFn = (payload: unknown) => Promise<VerifiedPayosWebhook>;

export class HandlePayosWebhookUseCase {
  private readonly verifyWebhook: VerifyWebhookFn;

  constructor(
    private readonly paymentRepository: IPaymentRepository,
    private readonly paymentSuccessNotifier: IPaymentSuccessNotifier,
    verifyWebhook?: VerifyWebhookFn,
  ) {
    this.verifyWebhook =
      verifyWebhook ??
      (async (payload: unknown) =>
        (await getPayosClient().webhooks.verify(payload as any)) as VerifiedPayosWebhook);
  }

  async execute(payload: unknown): Promise<HandlePayosWebhookResult> {
    const verified = await this.verifyWebhook(payload);
    const orderCode = String(verified.orderCode);
    const nextStatus = verified.code === '00' ? 'PAID' : 'FAILED';
    const paidAt =
      nextStatus === 'PAID'
        ? new Date(verified.transactionDateTime ?? new Date().toISOString())
        : null;

    const updated = await this.paymentRepository.updateFromWebhookIfPending({
      orderCode,
      status: nextStatus,
      paymentLinkId: verified.paymentLinkId || null,
      gatewayReference: verified.reference || null,
      gatewayCode: verified.code || null,
      bankCode: verified.counterAccountBankId || null,
      paidAt,
      rawPayload: {
        verified,
        payload,
      },
    });

    logger.info('PayOS webhook processed', {
      orderCode,
      status: nextStatus,
      code: verified.code,
      updated,
    });

    if (!updated) {
      logger.warn('PayOS webhook did not update DB (missing orderCode or not pending)', {
        orderCode,
        status: nextStatus,
        code: verified.code,
      });
    }

    if (updated && nextStatus === 'PAID') {
      const payment = await this.paymentRepository.findByOrderCode(orderCode);
      if (payment && payment.status === 'PAID') {
        try {
          await this.paymentSuccessNotifier.notify({
            orderId: payment.orderId,
            orderCode: payment.orderCode,
            amount: payment.amount,
            paidAt: payment.paidAt ?? new Date(),
          });
        } catch (error) {
          logger.warn('Payment success notification failed', {
            orderCode,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }

    return {
      processed: true,
      orderCode,
      status: nextStatus,
    };
  }
}
