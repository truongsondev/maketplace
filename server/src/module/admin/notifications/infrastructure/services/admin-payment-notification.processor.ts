import { Prisma, PrismaClient } from '@/generated/prisma/client';
import { redis } from '../../../../../infrastructure/database';
import { createLogger } from '../../../../../shared/util/logger';
import { adminNotificationHub } from '../realtime/admin-notification-hub';

const logger = createLogger('AdminPaymentNotificationProcessor');

export interface AdminPaymentNotificationInput {
  orderId: string;
  orderCode: string;
  amount: number;
  paidAt: Date;
}

export class AdminPaymentNotificationProcessor {
  constructor(private readonly prisma: PrismaClient) {}

  async process(input: AdminPaymentNotificationInput): Promise<boolean> {
    const dedupeKey = `notify:admin:payment-success:${input.orderId}`;
    const lockResult = await redis.set(
      dedupeKey,
      input.paidAt.toISOString(),
      'EX',
      60 * 60 * 24 * 7,
      'NX',
    );

    if (lockResult !== 'OK') {
      return false;
    }

    try {
      const admins = await this.prisma.userRole.findMany({
        where: {
          role: {
            code: 'ADMIN',
          },
        },
        select: {
          userId: true,
        },
        distinct: ['userId'],
      });

      if (admins.length === 0) {
        return false;
      }

      const amountText = new Intl.NumberFormat('vi-VN').format(input.amount);
      const content = `Don hang #${input.orderCode} da thanh toan thanh cong (${amountText} VND)`;

      const createdRows = await this.prisma.$transaction(
        admins.map((admin) =>
          this.prisma.notification.create({
            data: {
              userId: admin.userId,
              content,
              isRead: false,
            },
            select: {
              id: true,
              content: true,
              isRead: true,
              createdAt: true,
              userId: true,
            },
          }),
        ),
      );

      for (const row of createdRows) {
        adminNotificationHub.sendPaymentSuccess(row.userId, {
          id: row.id,
          content: row.content,
          isRead: row.isRead,
          createdAt: row.createdAt.toISOString(),
        });
      }

      await this.prisma.auditLog.create({
        data: {
          actorType: 'SYSTEM',
          targetType: 'Order',
          targetId: input.orderId,
          action: 'ADMIN_PAYMENT_NOTIFICATION_SENT',
          newData: {
            orderCode: input.orderCode,
            amount: input.amount,
            paidAt: input.paidAt,
            receivers: createdRows.length,
          } as Prisma.InputJsonValue,
        },
      });

      logger.info('Admin notifications sent for paid order', {
        orderCode: input.orderCode,
        receivers: createdRows.length,
      });

      return true;
    } catch (error) {
      await redis.del(dedupeKey);
      throw error;
    }
  }
}
