import { createLogger } from '../../../../shared/util/logger';
import { HandlePayosWebhookResult } from '../dto';
import { IPaymentRepository } from '../ports/output';
import { getPayosClient } from '../../infrastructure/payos/payos.client';

const logger = createLogger('HandlePayosWebhookUseCase');

export class HandlePayosWebhookUseCase {
  constructor(private readonly paymentRepository: IPaymentRepository) {}

  async execute(payload: unknown): Promise<HandlePayosWebhookResult> {
    const payos = getPayosClient();
    const verified = await payos.webhooks.verify(payload as any);
    const orderCode = String(verified.orderCode);
    const nextStatus = verified.code === '00' ? 'PAID' : 'FAILED';

    const updated = await this.paymentRepository.updateFromWebhookIfPending({
      orderCode,
      status: nextStatus,
      paymentLinkId: verified.paymentLinkId || null,
      gatewayReference: verified.reference || null,
      gatewayCode: verified.code || null,
      bankCode: verified.counterAccountBankId || null,
      paidAt: nextStatus === 'PAID' ? new Date(verified.transactionDateTime) : null,
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

    return {
      processed: true,
      orderCode,
      status: nextStatus,
    };
  }
}
