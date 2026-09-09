import type { ActorType } from '@/generated/prisma/enums';

export interface ListAdminLogsQuery {
  page: number;
  limit: number;
  actorType?: ActorType;
  actorId?: string;
  action?: string;
  targetType?: string;
  targetId?: string;
  from?: Date;
  to?: Date;
}

export interface AdminLogItem {
  id: string;
  actorType: ActorType;
  actorId: string | null;
  actorEmail: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  targetLabel: string | null;
  oldData: unknown | null;
  newData: unknown | null;
  createdAt: Date;
}

export interface ListAdminLogsResult {
  items: AdminLogItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
