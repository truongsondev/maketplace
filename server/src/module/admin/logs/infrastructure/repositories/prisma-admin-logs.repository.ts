import { Prisma, type PrismaClient } from '@/generated/prisma/client';
import type { ActorType } from '@/generated/prisma/enums';
import type { AdminLogItem, ListAdminLogsQuery } from '../../applications/dto/admin-logs.dto';
import type { IAdminLogsRepository } from '../../applications/ports/output/admin-logs.repository';

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  const set = new Set<string>();
  for (const v of values) {
    if (typeof v === 'string' && v) set.add(v);
  }
  return Array.from(set);
}

export class PrismaAdminLogsRepository implements IAdminLogsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async list(query: ListAdminLogsQuery): Promise<{ items: AdminLogItem[]; total: number }> {
    const skip = (query.page - 1) * query.limit;

    const createdAt: Prisma.DateTimeFilter | undefined =
      query.from || query.to
        ? {
            ...(query.from ? { gte: query.from } : {}),
            ...(query.to ? { lte: query.to } : {}),
          }
        : undefined;

    const where: Prisma.AuditLogWhereInput = {
      ...(query.actorType ? { actorType: query.actorType } : {}),
      ...(query.actorId ? { actorId: query.actorId } : {}),
      ...(query.targetId ? { targetId: query.targetId } : {}),
      ...(query.action
        ? {
            action: {
              contains: query.action,
            },
          }
        : {}),
      ...(query.targetType
        ? {
            targetType: {
              contains: query.targetType,
            },
          }
        : {}),
      ...(createdAt ? { createdAt } : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          actorType: true,
          actorId: true,
          targetType: true,
          targetId: true,
          action: true,
          oldData: true,
          newData: true,
          createdAt: true,
        },
      }),
    ]);

    const actorIds = uniqueStrings(rows.map((r) => r.actorId));
    const orderTargetIds = uniqueStrings(
      rows
        .filter((r) => r.targetType === 'Order')
        .map((r) => (typeof r.targetId === 'string' ? r.targetId : null)),
    );

    const [actors, orderCodes] = await Promise.all([
      actorIds.length
        ? this.prisma.user.findMany({
            where: { id: { in: actorIds } },
            select: { id: true, email: true },
          })
        : Promise.resolve([]),
      orderTargetIds.length
        ? this.prisma.paymentTransaction.findMany({
            where: { orderId: { in: orderTargetIds } },
            select: { orderId: true, orderCode: true },
          })
        : Promise.resolve([]),
    ]);

    const actorEmailById = new Map<string, string | null>(
      actors.map((u) => [u.id, u.email ?? null]),
    );
    const orderCodeByOrderId = new Map<string, string>(
      orderCodes.map((t) => [t.orderId, t.orderCode]),
    );

    const items: AdminLogItem[] = rows.map((row) => {
      const actorId = row.actorId ?? null;
      const targetId = row.targetId ?? null;
      const targetType = row.targetType ?? null;

      const actorEmail = actorId ? (actorEmailById.get(actorId) ?? null) : null;
      const targetLabel =
        targetType === 'Order' && typeof targetId === 'string'
          ? (orderCodeByOrderId.get(targetId) ?? null)
          : null;

      return {
        id: row.id,
        actorType: row.actorType as ActorType,
        actorId,
        actorEmail,
        action: row.action,
        targetType,
        targetId,
        targetLabel,
        oldData: row.oldData ?? null,
        newData: row.newData ?? null,
        createdAt: row.createdAt,
      };
    });

    return { items, total };
  }
}
