export type AdminUserStatus = "ACTIVE" | "SUSPENDED" | "BANNED";
export type AdminUserRole = "ADMIN" | "BUYER";

export interface AdminUserListItem {
  id: string;
  email: string | null;
  phone: string | null;
  status: AdminUserStatus;
  emailVerified: boolean;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
  role: AdminUserRole;
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

export interface AdminUsersResponse {
  success: boolean;
  data: {
    items: AdminUserListItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    aggregations: AdminUsersAggregation;
  };
  message: string;
  timestamp: string;
}

export interface AdminUserActivityItem {
  id: string;
  action: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface AdminUserDetail extends AdminUserListItem {
  addressesCount: number;
  ordersCount: number;
  totalSpent: number;
  activities: AdminUserActivityItem[];
}

export interface AdminUserDetailResponse {
  success: boolean;
  data: AdminUserDetail;
  message: string;
  timestamp: string;
}

export interface AdminUserMutationResponse {
  success: boolean;
  data: AdminUserListItem;
  message: string;
  timestamp: string;
}

export interface AdminUserAuditItem {
  id: string;
  action: string;
  reason: string | null;
  actorAdminId: string | null;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  createdAt: string;
}

export interface AdminUserAuditsResponse {
  success: boolean;
  data: {
    items: AdminUserAuditItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  message: string;
  timestamp: string;
}

export interface AdminUserCustomerCohorts {
  from: string;
  to: string;
  days: number;
  customersWithOrders: number;
  newCustomers: number;
  returningCustomers: number;
  updatedAt: string;
}

export interface AdminUserTopSpenderItem {
  userId: string;
  email: string | null;
  phone: string | null;
  totalSpent: number;
  ordersCount: number;
  lastPaidAt: string | null;
}

export interface AdminUserTopSpenders {
  from: string;
  to: string;
  days: number;
  limit: number;
  items: AdminUserTopSpenderItem[];
  updatedAt: string;
}

export interface AdminUserCustomerCohortsResponse {
  success: boolean;
  data: AdminUserCustomerCohorts;
  message: string;
  timestamp: string;
}

export interface AdminUserTopSpendersResponse {
  success: boolean;
  data: AdminUserTopSpenders;
  message: string;
  timestamp: string;
}
