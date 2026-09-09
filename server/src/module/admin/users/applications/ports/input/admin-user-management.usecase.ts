import type {
  AdminUserAuditItem,
  AdminUserDetail,
  AdminUserSummary,
  ListAdminUserAuditsCommand,
  ListAdminUsersCommand,
  UpdateAdminUserRoleCommand,
  UpdateAdminUserStatusCommand,
} from '../../dto/admin-user.dto';

export interface IListAdminUsersUseCase {
  execute(
    params: ListAdminUsersCommand,
  ): Promise<{ items: AdminUserSummary[]; total: number; aggregations: any }>;
}

export interface IGetAdminUserByIdUseCase {
  execute(userId: string): Promise<AdminUserDetail>;
}

export interface ISetAdminUserStatusUseCase {
  execute(command: UpdateAdminUserStatusCommand): Promise<AdminUserSummary>;
}

export interface ISetAdminUserRoleUseCase {
  execute(command: UpdateAdminUserRoleCommand): Promise<AdminUserSummary>;
}

export interface IListAdminUserAuditsUseCase {
  execute(
    command: ListAdminUserAuditsCommand,
  ): Promise<{ items: AdminUserAuditItem[]; total: number }>;
}

export interface IExportAdminUsersUseCase {
  execute(params: Omit<ListAdminUsersCommand, 'page' | 'limit'>): Promise<AdminUserSummary[]>;
}
