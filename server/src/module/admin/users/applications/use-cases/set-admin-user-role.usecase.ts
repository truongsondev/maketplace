import type { ISetAdminUserRoleUseCase } from '../ports/input/admin-user-management.usecase';
import type { IAdminUserManagementRepository } from '../ports/output/admin-user-management.repository';
import type { UpdateAdminUserRoleCommand } from '../dto/admin-user.dto';

export class SetAdminUserRoleUseCase implements ISetAdminUserRoleUseCase {
  constructor(private readonly repository: IAdminUserManagementRepository) {}

  execute(command: UpdateAdminUserRoleCommand) {
    return this.repository.setUserRole(command);
  }
}
