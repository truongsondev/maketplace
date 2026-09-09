import { PrismaClient } from '@/generated/prisma/client';
import { rabbitMQService } from '../../../../../infrastructure/messaging/rabbitmq.service';
import { createLogger } from '../../../../../shared/util/logger';
import {
  AdminPaymentNotificationProcessor,
  type AdminPaymentNotificationInput,
} from '../services/admin-payment-notification.processor';
import { AdminNewOrderNotificationProcessor } from '../services/admin-new-order-notification.processor';

const logger = createLogger('AdminPaymentSuccessConsumer');

export class AdminPaymentSuccessConsumer {
  private started = false;
  private readonly processor: AdminPaymentNotificationProcessor;
  private readonly newOrderProcessor: AdminNewOrderNotificationProcessor;

  constructor(prisma: PrismaClient) {
    this.processor = new AdminPaymentNotificationProcessor(prisma);
    this.newOrderProcessor = new AdminNewOrderNotificationProcessor(prisma);
  }

  start(): void {
    if (this.started) return;
    this.started = true;

    void rabbitMQService
      .consumePaymentSuccess(async (event) => {
        const payload: AdminPaymentNotificationInput = {
          orderId: event.orderId,
          orderCode: event.orderCode,
          amount: event.amount,
          paidAt: new Date(event.paidAt),
        };

        await this.processor.process(payload);
        await this.newOrderProcessor.process({
          orderId: event.orderId,
          orderCode: event.orderCode,
          totalAmount: event.amount,
          paidAt: new Date(event.paidAt),
        });
      })
      .catch((error) => {
        this.started = false;
        logger.error('Unable to start RabbitMQ payment-success consumer', {
          error: error instanceof Error ? error.message : String(error),
        });
      });
  }
}
