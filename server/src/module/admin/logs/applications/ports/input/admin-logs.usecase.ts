import type { ListAdminLogsQuery, ListAdminLogsResult } from '../../dto/admin-logs.dto';

export interface IListAdminLogsUseCase {
  execute(query: ListAdminLogsQuery): Promise<ListAdminLogsResult>;
}
