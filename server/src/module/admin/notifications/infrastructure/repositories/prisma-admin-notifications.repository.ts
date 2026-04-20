import { Prisma, type PrismaClient } from '@/generated/prisma/client';
import type {
  AdminNotificationItem,
  BroadcastAdminPaymentSuccessInput,
  ListAdminNotificationsQuery,
  ListAdminNotificationsResult,
} from '../../applications/dto/admin-notification.dto';
import type { IAdminNotificationsRepository } from '../../applications/ports/output/admin-notifications.repository';

function toItem(row: {
  id: string;
  content: string;
  isRead: boolean;
  createdAt: Date;
}): AdminNotificationItem {
  return {
    id: row.id,
    content: row.content,
    isRead: row.isRead,
    createdAt: row.createdAt,
  };
}

export class PrismaAdminNotificationsRepository implements IAdminNotificationsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listByAdminUserId(
    userId: string,
    query: ListAdminNotificationsQuery,
  ): Promise<ListAdminNotificationsResult> {
    const skip = (query.page - 1) * query.limit;

    const [items, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.limit,
        select: {
          id: true,
          content: true,
          isRead: true,
          createdAt: true,
        },
      }),
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      items: items.map(toItem),
      total,
      page: query.page,
      limit: query.limit,
      unreadCount,
    };
  }

  async markAsRead(userId: string, notificationId: string): Promise<boolean> {
    const updated = await this.prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return updated.count > 0;
  }

  async markAllAsRead(userId: string): Promise<number> {
    const updated = await this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return updated.count;
  }

  async createForAllAdmins(
    input: BroadcastAdminPaymentSuccessInput,
  ): Promise<AdminNotificationItem[]> {
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
      return [];
    }

    const content = `Don hang #${input.orderCode} da thanh toan thanh cong (${new Intl.NumberFormat(
      'vi-VN',
    ).format(input.amount)} VND)`;

    const rows = await this.prisma.$transaction(
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
          },
        }),
      ),
    );

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
          receivers: admins.length,
        } as Prisma.InputJsonValue,
      },
    });

    return rows.map(toItem);
  }
}
