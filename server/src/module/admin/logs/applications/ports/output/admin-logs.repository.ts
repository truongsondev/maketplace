import type { AdminLogItem, ListAdminLogsQuery } from '../../dto/admin-logs.dto';

export interface IAdminLogsRepository {
  list(query: ListAdminLogsQuery): Promise<{ items: AdminLogItem[]; total: number }>;
}
