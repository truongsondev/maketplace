import type { ListAdminUserAuditsCommand } from '../dto/admin-user.dto';
import type { IListAdminUserAuditsUseCase } from '../ports/input/admin-user-management.usecase';
import type { IAdminUserManagementRepository } from '../ports/output/admin-user-management.repository';

export class ListAdminUserAuditsUseCase implements IListAdminUserAuditsUseCase {
  constructor(private readonly repository: IAdminUserManagementRepository) {}

  execute(command: ListAdminUserAuditsCommand) {
    return this.repository.listUserAudits(command);
  }
}
