import { Prisma, PrismaClient } from '@/generated/prisma/client';
import { redis } from '../../../../../infrastructure/database';
import { createLogger } from '../../../../../shared/util/logger';
import { adminNotificationHub } from '../realtime/admin-notification-hub';

const logger = createLogger('AdminLowStockNotificationProcessor');
const LOW_STOCK_DEDUPE_TTL_SECONDS = Number(process.env.ADMIN_LOW_STOCK_DEDUPE_TTL_SEC || 86400);

export interface AdminLowStockNotificationInput {
  orderId: string;
  orderCode: string | null;
  productId: string;
  productName: string;
  variantId: string;
  sku: string;
  stockOnHand: number;
  minStock: number;
}

export class AdminLowStockNotificationProcessor {
  constructor(private readonly prisma: PrismaClient) {}

  async process(input: AdminLowStockNotificationInput): Promise<boolean> {
    const dedupeKey = `notify:admin:low-stock:${input.variantId}:${input.stockOnHand}`;
    const lockResult = await redis.set(
      dedupeKey,
      JSON.stringify({ stockOnHand: input.stockOnHand, minStock: input.minStock }),
      'EX',
      Number.isFinite(LOW_STOCK_DEDUPE_TTL_SECONDS) && LOW_STOCK_DEDUPE_TTL_SECONDS > 0
        ? LOW_STOCK_DEDUPE_TTL_SECONDS
        : 86400,
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

      const content = `Canh bao ton kho thap: ${input.productName} (SKU: ${input.sku}) con ${input.stockOnHand}, nguong canh bao ${input.minStock}`;

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
        adminNotificationHub.sendLowStock(row.userId, {
          id: row.id,
          content: row.content,
          isRead: row.isRead,
          createdAt: row.createdAt.toISOString(),
        });
      }

      await this.prisma.auditLog.create({
        data: {
          actorType: 'SYSTEM',
          targetType: 'ProductVariant',
          targetId: input.variantId,
          action: 'ADMIN_LOW_STOCK_NOTIFICATION_SENT',
          newData: {
            orderId: input.orderId,
            orderCode: input.orderCode,
            productId: input.productId,
            productName: input.productName,
            variantId: input.variantId,
            sku: input.sku,
            stockOnHand: input.stockOnHand,
            minStock: input.minStock,
            receivers: createdRows.length,
          } as Prisma.InputJsonValue,
        },
      });

      logger.info('Admin notifications sent for low-stock variant', {
        variantId: input.variantId,
        sku: input.sku,
        stockOnHand: input.stockOnHand,
        minStock: input.minStock,
        receivers: createdRows.length,
      });

      return true;
    } catch (error) {
      await redis.del(dedupeKey);
      throw error;
    }
  }
}
