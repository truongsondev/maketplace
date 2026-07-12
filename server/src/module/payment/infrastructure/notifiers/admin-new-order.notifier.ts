import { PrismaClient } from '@/generated/prisma/client';
import type {
  INewOrderNotifier,
  NewOrderNotification,
} from '../../applications/ports/output/new-order-notifier';
import { createLogger } from '../../../../shared/util/logger';
import { AdminNewOrderNotificationProcessor } from '../../../admin/notifications/infrastructure/services/admin-new-order-notification.processor';

const logger = createLogger('AdminNewOrderNotifier');

export class AdminNewOrderNotifier implements INewOrderNotifier {
  private readonly processor: AdminNewOrderNotificationProcessor;

  constructor(prisma: PrismaClient) {
    this.processor = new AdminNewOrderNotificationProcessor(prisma);
  }

  async notify(input: NewOrderNotification): Promise<void> {
    try {
      await this.processor.process({
        orderId: input.orderId,
        orderCode: input.orderCode,
        customerName: input.customerName,
        totalAmount: input.totalAmount,
        paidAt: input.createdAt,
      });
    } catch (error) {
      // A notification outage must not turn an already-created COD order into
      // an apparent checkout failure that the customer may retry.
      logger.error('Unable to notify admins about new COD order', {
        orderId: input.orderId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
