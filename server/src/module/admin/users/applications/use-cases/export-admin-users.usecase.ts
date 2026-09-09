import type { ListAdminUsersCommand } from '../dto/admin-user.dto';
import type { IExportAdminUsersUseCase } from '../ports/input/admin-user-management.usecase';
import type { IAdminUserManagementRepository } from '../ports/output/admin-user-management.repository';

export class ExportAdminUsersUseCase implements IExportAdminUsersUseCase {
  constructor(private readonly repository: IAdminUserManagementRepository) {}

  execute(params: Omit<ListAdminUsersCommand, 'page' | 'limit'>) {
    return this.repository.exportUsers(params);
  }
}
