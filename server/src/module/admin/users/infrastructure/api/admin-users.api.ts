import express, { Request, Response } from 'express';
import { BadRequestError } from '../../../../../error-handlling/badRequestError';
import { asyncHandler } from '../../../../../shared/server/error-middleware';
import { ResponseFormatter } from '../../../../../shared/server/api-response';
import type {
  AdminUserRole,
  AdminUserStatus,
  ListAdminUsersCommand,
} from '../../applications/dto/admin-user.dto';
import { AdminUsersController } from '../../interface-adapter/controller/admin-users.controller';
import type { AdminUserAnalyticsController } from '../../interface-adapter/controller/admin-user-analytics.controller';

function parsePositiveInt(value: unknown, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

function parseOptionalBoolean(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (value === true || value === 'true' || value === '1') return true;
  if (value === false || value === 'false' || value === '0') return false;
  throw new BadRequestError('emailVerified must be a boolean');
}

function parseStatus(value: unknown): AdminUserStatus | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const status = String(value).toUpperCase();
  if (status === 'ACTIVE' || status === 'SUSPENDED' || status === 'BANNED') {
    return status;
  }

  throw new BadRequestError('status must be ACTIVE, SUSPENDED, or BANNED');
}

function parseRole(value: unknown): AdminUserRole | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const role = String(value).toUpperCase();
  if (role === 'ADMIN' || role === 'BUYER') {
    return role;
  }

  throw new BadRequestError('role must be ADMIN or BUYER');
}

function parseSortBy(value: unknown): ListAdminUsersCommand['sortBy'] {
  if (!value) return undefined;
  const sortBy = String(value);
  if (sortBy === 'createdAt' || sortBy === 'lastLogin' || sortBy === 'email') {
    return sortBy;
  }
  throw new BadRequestError('sortBy must be one of: createdAt, lastLogin, email');
}

function parseSortOrder(value: unknown): ListAdminUsersCommand['sortOrder'] {
  if (!value) return undefined;
  const sortOrder = String(value).toLowerCase();
  if (sortOrder === 'asc' || sortOrder === 'desc') {
    return sortOrder;
  }
  throw new BadRequestError('sortOrder must be asc or desc');
}

function escapeCsvValue(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export class AdminUsersAPI {
  readonly router = express.Router();

  constructor(
    private readonly controller: AdminUsersController,
    private readonly analyticsController: AdminUserAnalyticsController,
  ) {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get('/', asyncHandler(this.listUsers.bind(this)));
    this.router.get('/export', asyncHandler(this.exportUsers.bind(this)));
    this.router.get(
      '/analytics/customer-cohorts',
      asyncHandler(this.getCustomerCohorts.bind(this)),
    );
    this.router.get('/analytics/top-spenders', asyncHandler(this.getTopSpenders.bind(this)));
    this.router.get('/:id', asyncHandler(this.getUserById.bind(this)));
    this.router.patch('/:id/status', asyncHandler(this.updateStatus.bind(this)));
    this.router.patch('/:id/role', asyncHandler(this.updateRole.bind(this)));
    this.router.get('/:id/audits', asyncHandler(this.getAudits.bind(this)));
  }

  private async getCustomerCohorts(req: Request, res: Response): Promise<void> {
    const days = parsePositiveInt(req.query.days, 30);
    const result = await this.analyticsController.getCustomerCohorts({ days });
    res.status(200).json(ResponseFormatter.success(result, 'OK'));
  }

  private async getTopSpenders(req: Request, res: Response): Promise<void> {
    const days = parsePositiveInt(req.query.days, 30);
    const limit = Math.min(parsePositiveInt(req.query.limit, 10), 50);
    const result = await this.analyticsController.getTopSpenders({ days, limit });
    res.status(200).json(ResponseFormatter.success(result, 'OK'));
  }

  private parseListQuery(req: Request): ListAdminUsersCommand {
    return {
      page: parsePositiveInt(req.query.page, 1),
      limit: Math.min(parsePositiveInt(req.query.limit, 20), 100),
      search: typeof req.query.search === 'string' ? req.query.search.trim() : undefined,
      status: parseStatus(req.query.status),
      role: parseRole(req.query.role),
      emailVerified: parseOptionalBoolean(req.query.emailVerified),
      sortBy: parseSortBy(req.query.sortBy),
      sortOrder: parseSortOrder(req.query.sortOrder),
    };
  }

  private async listUsers(req: Request, res: Response): Promise<void> {
    const command = this.parseListQuery(req);
    const result = await this.controller.listUsers(command);
    const totalPages = Math.ceil(result.total / command.limit);

    res.status(200).json(
      ResponseFormatter.success(
        {
          items: result.items,
          pagination: {
            page: command.page,
            limit: command.limit,
            total: result.total,
            totalPages,
          },
          aggregations: result.aggregations,
        },
        'Users fetched successfully',
      ),
    );
  }

  private async getUserById(req: Request, res: Response): Promise<void> {
    const userId = String(req.params.id || '');
    if (!userId) {
      throw new BadRequestError('id is required');
    }

    const result = await this.controller.getUserById(userId);
    res.status(200).json(ResponseFormatter.success(result, 'User fetched successfully'));
  }

  private async updateStatus(req: Request, res: Response): Promise<void> {
    const userId = String(req.params.id || '');
    if (!userId) {
      throw new BadRequestError('id is required');
    }

    const status = parseStatus((req.body as { status?: unknown })?.status);
    const reason = String((req.body as { reason?: unknown })?.reason || '').trim();
    if (!status) {
      throw new BadRequestError('status is required');
    }
    if (!reason) {
      throw new BadRequestError('reason is required');
    }

    const actorAdminId = req.userId;
    if (!actorAdminId) {
      throw new BadRequestError('actor admin is required');
    }
    if (actorAdminId === userId && status !== 'ACTIVE') {
      throw new BadRequestError('You cannot suspend or ban your own account');
    }

    const result = await this.controller.setUserStatus({
      userId,
      status,
      reason,
      actorAdminId,
    });

    res.status(200).json(ResponseFormatter.success(result, 'User status updated successfully'));
  }

  private async updateRole(req: Request, res: Response): Promise<void> {
    const userId = String(req.params.id || '');
    if (!userId) {
      throw new BadRequestError('id is required');
    }

    const role = parseRole((req.body as { role?: unknown })?.role);
    const reason = String((req.body as { reason?: unknown })?.reason || '').trim();
    if (!role) {
      throw new BadRequestError('role is required');
    }
    if (!reason) {
      throw new BadRequestError('reason is required');
    }

    const actorAdminId = req.userId;
    if (!actorAdminId) {
      throw new BadRequestError('actor admin is required');
    }

    const result = await this.controller.setUserRole({
      userId,
      role,
      reason,
      actorAdminId,
    });

    res.status(200).json(ResponseFormatter.success(result, 'User role updated successfully'));
  }

  private async getAudits(req: Request, res: Response): Promise<void> {
    const userId = String(req.params.id || '');
    if (!userId) {
      throw new BadRequestError('id is required');
    }

    const page = parsePositiveInt(req.query.page, 1);
    const limit = Math.min(parsePositiveInt(req.query.limit, 20), 100);
    const result = await this.controller.listUserAudits({ userId, page, limit });

    res.status(200).json(
      ResponseFormatter.success(
        {
          items: result.items,
          pagination: {
            page,
            limit,
            total: result.total,
            totalPages: Math.ceil(result.total / limit),
          },
        },
        'User audits fetched successfully',
      ),
    );
  }

  private async exportUsers(req: Request, res: Response): Promise<void> {
    const command = this.parseListQuery(req);
    const rows = await this.controller.exportUsers({
      search: command.search,
      status: command.status,
      role: command.role,
      emailVerified: command.emailVerified,
      sortBy: command.sortBy,
      sortOrder: command.sortOrder,
    });

    const headers = [
      'id',
      'email',
      'phone',
      'role',
      'status',
      'emailVerified',
      'lastLogin',
      'createdAt',
      'updatedAt',
    ];

    const lines = rows.map((row) =>
      [
        row.id,
        row.email || '',
        row.phone || '',
        row.role,
        row.status,
        String(row.emailVerified),
        row.lastLogin ? row.lastLogin.toISOString() : '',
        row.createdAt.toISOString(),
        row.updatedAt.toISOString(),
      ]
        .map((value) => escapeCsvValue(value))
        .join(','),
    );

    const csv = [headers.join(','), ...lines].join('\n');
    const filename = `admin-users-${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csv);
  }
}
