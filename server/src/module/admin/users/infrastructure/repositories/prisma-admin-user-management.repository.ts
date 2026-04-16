import { Prisma, type PrismaClient } from '@/generated/prisma/client';
import { BadRequestError } from '../../../../../error-handlling/badRequestError';
import { NotFoundError } from '../../../../../error-handlling/notFoundError';
import type {
  AdminUserAuditItem,
  AdminUserDetail,
  AdminUserRole,
  AdminUserStatus,
  AdminUserSummary,
  AdminUsersAggregation,
  ListAdminUsersCommand,
} from '../../applications/dto/admin-user.dto';
import type { IAdminUserManagementRepository } from '../../applications/ports/output/admin-user-management.repository';

type RoleCode = 'ADMIN' | 'BUYER';

function toAppRole(codes: string[]): AdminUserRole {
  return codes.includes('ADMIN') ? 'ADMIN' : 'BUYER';
}

function toAppStatus(status: string): AdminUserStatus {
  if (status === 'SUSPENDED' || status === 'BANNED') {
    return status;
  }
  return 'ACTIVE';
}

function parseAuditMetadata(value: Prisma.JsonValue | null): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

export class PrismaAdminUserManagementRepository implements IAdminUserManagementRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listUsers(
    params: ListAdminUsersCommand,
  ): Promise<{ items: AdminUserSummary[]; total: number; aggregations: AdminUsersAggregation }> {
    const search = params.search?.trim();
    const baseWhere: Prisma.UserWhereInput = {
      ...(search
        ? {
            OR: [
              { id: { contains: search } },
              { email: { contains: search } },
              { phone: { contains: search } },
            ],
          }
        : {}),
      ...(typeof params.emailVerified === 'boolean' ? { emailVerified: params.emailVerified } : {}),
    };

    const where: Prisma.UserWhereInput = {
      ...baseWhere,
      ...(params.status ? { status: params.status } : {}),
      ...this.roleFilter(params.role),
    };

    const skip = (params.page - 1) * params.limit;
    const orderBy = this.buildOrderBy(params);

    const [rows, total, activeCount, suspendedCount, bannedCount, adminCount, buyerCount] =
      await Promise.all([
        this.prisma.user.findMany({
          where,
          skip,
          take: params.limit,
          orderBy,
          include: {
            userRoles: {
              include: {
                role: true,
              },
            },
            refreshTokens: {
              select: {
                createdAt: true,
              },
              orderBy: {
                createdAt: 'desc',
              },
              take: 1,
            },
          },
        }),
        this.prisma.user.count({ where }),
        this.prisma.user.count({ where: { ...baseWhere, status: 'ACTIVE' } }),
        this.prisma.user.count({ where: { ...baseWhere, status: 'SUSPENDED' } }),
        this.prisma.user.count({ where: { ...baseWhere, status: 'BANNED' } }),
        this.prisma.user.count({
          where: {
            ...baseWhere,
            userRoles: { some: { role: { code: 'ADMIN' } } },
          },
        }),
        this.prisma.user.count({
          where: {
            ...baseWhere,
            userRoles: {
              some: { role: { code: 'BUYER' } },
              none: { role: { code: 'ADMIN' } },
            },
          },
        }),
      ]);

    return {
      items: rows.map((row) => this.toSummary(row)),
      total,
      aggregations: {
        statusCount: {
          active: activeCount,
          suspended: suspendedCount,
          banned: bannedCount,
        },
        roleCount: {
          admin: adminCount,
          buyer: buyerCount,
        },
      },
    };
  }

  async getUserById(userId: string): Promise<AdminUserDetail | null> {
    const row = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
        refreshTokens: {
          select: {
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!row) {
      return null;
    }

    const [addressesCount, orderStats, activities] = await Promise.all([
      this.prisma.userAddress.count({ where: { userId } }),
      this.prisma.order.aggregate({
        where: { userId },
        _count: { id: true },
        _sum: { totalPrice: true },
      }),
      this.prisma.userActivityLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    const summary = this.toSummary(row);
    return {
      ...summary,
      addressesCount,
      ordersCount: orderStats._count.id,
      totalSpent: orderStats._sum.totalPrice ? Number(orderStats._sum.totalPrice) : 0,
      activities: activities.map((item) => ({
        id: item.id,
        action: item.action,
        metadata: parseAuditMetadata(item.metadata),
        createdAt: item.createdAt,
      })),
    };
  }

  async setUserStatus(params: {
    userId: string;
    status: AdminUserStatus;
    reason: string;
    actorAdminId: string;
  }): Promise<AdminUserSummary> {
    const existing = await this.prisma.user.findUnique({
      where: { id: params.userId },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
        refreshTokens: {
          select: {
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!existing) {
      throw new NotFoundError('User not found');
    }

    const oldStatus = toAppStatus(existing.status);

    const updated = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: params.userId },
        data: { status: params.status },
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
          refreshTokens: {
            select: {
              createdAt: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
          },
        },
      });

      if (params.status !== 'ACTIVE') {
        await tx.refreshToken.updateMany({
          where: { userId: params.userId, revoked: false },
          data: { revoked: true },
        });
      }

      await tx.userActivityLog.create({
        data: {
          userId: params.userId,
          action: 'ADMIN_USER_STATUS_CHANGED',
          metadata: {
            actorAdminId: params.actorAdminId,
            reason: params.reason,
            oldStatus,
            newStatus: params.status,
          },
        },
      });

      return user;
    });

    return this.toSummary(updated);
  }

  async setUserRole(params: {
    userId: string;
    role: AdminUserRole;
    reason: string;
    actorAdminId: string;
  }): Promise<AdminUserSummary> {
    const [target, adminRole, buyerRole] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: params.userId },
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      }),
      this.prisma.role.findUnique({ where: { code: 'ADMIN' } }),
      this.prisma.role.findUnique({ where: { code: 'BUYER' } }),
    ]);

    if (!target) {
      throw new NotFoundError('User not found');
    }

    if (!adminRole || !buyerRole) {
      throw new BadRequestError('ADMIN or BUYER role is not configured');
    }

    const oldRole = toAppRole(target.userRoles.map((ur) => ur.role.code));
    if (oldRole === params.role) {
      return this.toSummary(target);
    }

    if (target.id === params.actorAdminId && params.role === 'BUYER') {
      throw new BadRequestError('Cannot remove ADMIN role from your own account');
    }

    if (oldRole === 'ADMIN' && params.role === 'BUYER') {
      const activeAdmins = await this.prisma.user.count({
        where: {
          id: { not: target.id },
          status: 'ACTIVE',
          userRoles: { some: { role: { code: 'ADMIN' } } },
        },
      });

      if (activeAdmins === 0) {
        throw new BadRequestError('At least one active ADMIN account must remain');
      }
    }

    const targetRoleId = params.role === 'ADMIN' ? adminRole.id : buyerRole.id;
    const managedRoleIds = [adminRole.id, buyerRole.id];

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.userRole.deleteMany({
        where: {
          userId: params.userId,
          roleId: { in: managedRoleIds },
        },
      });

      await tx.userRole.create({
        data: {
          userId: params.userId,
          roleId: targetRoleId,
        },
      });

      await tx.userActivityLog.create({
        data: {
          userId: params.userId,
          action: 'ADMIN_USER_ROLE_CHANGED',
          metadata: {
            actorAdminId: params.actorAdminId,
            reason: params.reason,
            oldRole,
            newRole: params.role,
          },
        },
      });

      return tx.user.findUnique({
        where: { id: params.userId },
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      });
    });

    if (!updated) {
      throw new NotFoundError('User not found after role update');
    }

    return this.toSummary(updated);
  }

  async listUserAudits(params: {
    userId: string;
    page: number;
    limit: number;
  }): Promise<{ items: AdminUserAuditItem[]; total: number }> {
    const skip = (params.page - 1) * params.limit;
    const where: Prisma.UserActivityLogWhereInput = {
      userId: params.userId,
      action: {
        in: ['ADMIN_USER_STATUS_CHANGED', 'ADMIN_USER_ROLE_CHANGED'],
      },
    };

    const [total, rows] = await Promise.all([
      this.prisma.userActivityLog.count({ where }),
      this.prisma.userActivityLog.findMany({
        where,
        skip,
        take: params.limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      total,
      items: rows.map((row) => {
        const metadata = parseAuditMetadata(row.metadata);
        const oldValue =
          metadata && typeof metadata.oldStatus === 'string'
            ? { status: metadata.oldStatus }
            : metadata && typeof metadata.oldRole === 'string'
              ? { role: metadata.oldRole }
              : null;
        const newValue =
          metadata && typeof metadata.newStatus === 'string'
            ? { status: metadata.newStatus }
            : metadata && typeof metadata.newRole === 'string'
              ? { role: metadata.newRole }
              : null;

        return {
          id: row.id,
          action: row.action,
          reason: metadata && typeof metadata.reason === 'string' ? metadata.reason : null,
          actorAdminId:
            metadata && typeof metadata.actorAdminId === 'string' ? metadata.actorAdminId : null,
          oldValue,
          newValue,
          createdAt: row.createdAt,
        };
      }),
    };
  }

  async exportUsers(
    params: Omit<ListAdminUsersCommand, 'page' | 'limit'>,
  ): Promise<AdminUserSummary[]> {
    const where: Prisma.UserWhereInput = {
      ...(params.search?.trim()
        ? {
            OR: [
              { id: { contains: params.search.trim() } },
              { email: { contains: params.search.trim() } },
              { phone: { contains: params.search.trim() } },
            ],
          }
        : {}),
      ...(typeof params.emailVerified === 'boolean' ? { emailVerified: params.emailVerified } : {}),
      ...(params.status ? { status: params.status } : {}),
      ...this.roleFilter(params.role),
    };

    const rows = await this.prisma.user.findMany({
      where,
      orderBy: this.buildOrderBy(params),
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
        refreshTokens: {
          select: {
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    });

    return rows.map((row) => this.toSummary(row));
  }

  private roleFilter(role?: AdminUserRole): Prisma.UserWhereInput {
    if (!role) {
      return {};
    }

    if (role === 'ADMIN') {
      return {
        userRoles: { some: { role: { code: 'ADMIN' } } },
      };
    }

    return {
      userRoles: {
        some: { role: { code: 'BUYER' } },
        none: { role: { code: 'ADMIN' } },
      },
    };
  }

  private buildOrderBy(params: {
    sortBy?: 'createdAt' | 'lastLogin' | 'email';
    sortOrder?: 'asc' | 'desc';
  }): Prisma.UserOrderByWithRelationInput {
    const direction = params.sortOrder === 'asc' ? 'asc' : 'desc';
    const sortBy = params.sortBy ?? 'createdAt';

    if (sortBy === 'email') {
      return { email: direction };
    }

    if (sortBy === 'lastLogin') {
      return { lastLogin: direction };
    }

    return { createdAt: direction };
  }

  private toSummary(row: {
    id: string;
    email: string | null;
    phone: string | null;
    status: string;
    emailVerified: boolean;
    lastLogin: Date | null;
    createdAt: Date;
    updatedAt: Date;
    userRoles: Array<{ role: { code: string } }>;
    refreshTokens?: Array<{ createdAt: Date }>;
  }): AdminUserSummary {
    const roleCodes = row.userRoles.map((ur) => ur.role.code);
    const fallbackLastLogin = row.refreshTokens?.[0]?.createdAt ?? null;
    return {
      id: row.id,
      email: row.email,
      phone: row.phone,
      status: toAppStatus(row.status),
      emailVerified: row.emailVerified,
      lastLogin: fallbackLastLogin,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      role: toAppRole(roleCodes),
    };
  }
}
