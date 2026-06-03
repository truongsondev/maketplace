import { Prisma, PrismaClient } from '@/generated/prisma/client';
import { redis } from '../../../../../infrastructure/database';
import { createLogger } from '../../../../../shared/util/logger';
import { adminNotificationHub } from '../realtime/admin-notification-hub';

const logger = createLogger('AdminNewOrderNotificationProcessor');

export interface AdminNewOrderNotificationInput {
  orderId: string;
  orderCode: string;
  customerName?: string | null;
  totalAmount: number;
  paidAt: Date;
}

export class AdminNewOrderNotificationProcessor {
  constructor(private readonly prisma: PrismaClient) {}

  async process(input: AdminNewOrderNotificationInput): Promise<boolean> {
    const dedupeKey = `notify:admin:new-order:${input.orderId}`;
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

      const amountText = new Intl.NumberFormat('vi-VN').format(input.totalAmount);
      const customerText = input.customerName?.trim()
        ? ` từ khách hàng ${input.customerName.trim()}`
        : '';
      const content = `[NEW_ORDER|${input.orderId}] Đơn hàng mới #${input.orderCode}${customerText} (${amountText} VND)`;

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
              userId: true,
              content: true,
              isRead: true,
              createdAt: true,
            },
          }),
        ),
      );

      for (const row of createdRows) {
        adminNotificationHub.sendNewOrder(row.userId, {
          id: row.id,
          content: row.content,
          isRead: row.isRead,
          createdAt: row.createdAt.toISOString(),
          type: 'NEW_ORDER',
          orderId: input.orderId,
          orderCode: input.orderCode,
          customerName: input.customerName?.trim() || null,
          totalAmount: input.totalAmount,
        });
      }

      await this.prisma.auditLog.create({
        data: {
          actorType: 'SYSTEM',
          targetType: 'Order',
          targetId: input.orderId,
          action: 'ADMIN_NEW_ORDER_NOTIFICATION_SENT',
          newData: {
            orderCode: input.orderCode,
            customerName: input.customerName?.trim() || null,
            totalAmount: input.totalAmount,
            paidAt: input.paidAt,
            receivers: createdRows.length,
          } as Prisma.InputJsonValue,
        },
      });

      logger.info('Admin notifications sent for new order', {
        orderId: input.orderId,
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
