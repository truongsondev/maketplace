import { PrismaClient } from '@/generated/prisma/client';
import type {
  IPaymentSuccessNotifier,
  PaymentSuccessNotification,
} from '../../applications/ports/output/payment-success-notifier';
import { rabbitMQService } from '../../../../infrastructure/messaging/rabbitmq.service';
import { createLogger } from '../../../../shared/util/logger';
import { AdminPaymentNotificationProcessor } from '../../../admin/notifications/infrastructure/services/admin-payment-notification.processor';

const logger = createLogger('AdminPaymentSuccessNotifier');

export class AdminPaymentSuccessNotifier implements IPaymentSuccessNotifier {
  private readonly processor: AdminPaymentNotificationProcessor;

  constructor(private readonly prisma: PrismaClient) {
    this.processor = new AdminPaymentNotificationProcessor(prisma);
  }

  async notify(input: PaymentSuccessNotification): Promise<void> {
    try {
      await rabbitMQService.publishPaymentSuccess({
        orderId: input.orderId,
        orderCode: input.orderCode,
        amount: input.amount,
        paidAt: input.paidAt.toISOString(),
      });
    } catch (error) {
      logger.warn('RabbitMQ publish failed, fallback to direct processor', {
        orderCode: input.orderCode,
        error: error instanceof Error ? error.message : String(error),
      });

      await this.processor.process(input);
    }
  }
}
