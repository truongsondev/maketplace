import { BadRequestError } from '../../../../../error-handlling/badRequestError';
import type { ISetAdminUserStatusUseCase } from '../ports/input/admin-user-management.usecase';
import type { IAdminUserManagementRepository } from '../ports/output/admin-user-management.repository';
import type { UpdateAdminUserStatusCommand } from '../dto/admin-user.dto';

export class SetAdminUserStatusUseCase implements ISetAdminUserStatusUseCase {
  constructor(private readonly repository: IAdminUserManagementRepository) {}

  async execute(command: UpdateAdminUserStatusCommand) {
    if (command.status === 'ACTIVE') {
      const current = await this.repository.getUserById(command.userId);
      if (!current) {
        throw new BadRequestError('User not found');
      }

      if (current.status === 'BANNED') {
        throw new BadRequestError('Cannot activate a banned user');
      }
    }

    return this.repository.setUserStatus(command);
  }
}
