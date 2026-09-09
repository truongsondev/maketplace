import type {
  AdminUserAuditItem,
  AdminUserDetail,
  AdminUserRole,
  AdminUserStatus,
  AdminUserSummary,
  AdminUsersAggregation,
  ListAdminUsersCommand,
} from '../../dto/admin-user.dto';

export interface IAdminUserManagementRepository {
  listUsers(
    params: ListAdminUsersCommand,
  ): Promise<{ items: AdminUserSummary[]; total: number; aggregations: AdminUsersAggregation }>;
  getUserById(userId: string): Promise<AdminUserDetail | null>;
  setUserStatus(params: {
    userId: string;
    status: AdminUserStatus;
    reason: string;
    actorAdminId: string;
  }): Promise<AdminUserSummary>;
  setUserRole(params: {
    userId: string;
    role: AdminUserRole;
    reason: string;
    actorAdminId: string;
  }): Promise<AdminUserSummary>;
  listUserAudits(params: {
    userId: string;
    page: number;
    limit: number;
  }): Promise<{ items: AdminUserAuditItem[]; total: number }>;
  exportUsers(params: Omit<ListAdminUsersCommand, 'page' | 'limit'>): Promise<AdminUserSummary[]>;
}
