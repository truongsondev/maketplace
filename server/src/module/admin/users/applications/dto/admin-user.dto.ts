export type AdminUserStatus = 'ACTIVE' | 'SUSPENDED' | 'BANNED';
export type AdminUserRole = 'ADMIN' | 'BUYER';

export interface ListAdminUsersCommand {
  page: number;
  limit: number;
  search?: string;
  status?: AdminUserStatus;
  role?: AdminUserRole;
  emailVerified?: boolean;
  sortBy?: 'createdAt' | 'lastLogin' | 'email';
  sortOrder?: 'asc' | 'desc';
}

export interface AdminUsersAggregation {
  statusCount: {
    active: number;
    suspended: number;
    banned: number;
  };
  roleCount: {
    admin: number;
    buyer: number;
  };
}

export interface AdminUserSummary {
  id: string;
  email: string | null;
  phone: string | null;
  status: AdminUserStatus;
  emailVerified: boolean;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
  role: AdminUserRole;
}

export interface AdminUserActivityItem {
  id: string;
  action: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

export interface AdminUserDetail extends AdminUserSummary {
  addressesCount: number;
  ordersCount: number;
  totalSpent: number;
  activities: AdminUserActivityItem[];
}

export interface AdminUserAuditItem {
  id: string;
  action: string;
  reason: string | null;
  actorAdminId: string | null;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  createdAt: Date;
}

export interface UpdateAdminUserStatusCommand {
  userId: string;
  status: AdminUserStatus;
  reason: string;
  actorAdminId: string;
}

export interface UpdateAdminUserRoleCommand {
  userId: string;
  role: AdminUserRole;
  reason: string;
  actorAdminId: string;
}

export interface ListAdminUserAuditsCommand {
  userId: string;
  page: number;
  limit: number;
}
