import type { ListAdminLogsQuery } from '../../applications/dto/admin-logs.dto';
import type { IListAdminLogsUseCase } from '../../applications/ports/input/admin-logs.usecase';

export class AdminLogsController {
  constructor(private readonly listUseCase: IListAdminLogsUseCase) {}

  list(query: ListAdminLogsQuery) {
    return this.listUseCase.execute(query);
  }
}
