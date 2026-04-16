import type { ListAdminUsersCommand } from '../dto/admin-user.dto';
import type { IListAdminUsersUseCase } from '../ports/input/admin-user-management.usecase';
import type { IAdminUserManagementRepository } from '../ports/output/admin-user-management.repository';

export class ListAdminUsersUseCase implements IListAdminUsersUseCase {
  constructor(private readonly repository: IAdminUserManagementRepository) {}

  execute(params: ListAdminUsersCommand) {
    return this.repository.listUsers(params);
  }
}
