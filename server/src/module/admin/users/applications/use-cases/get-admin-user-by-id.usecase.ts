import { NotFoundError } from '../../../../../error-handlling/notFoundError';
import type { AdminUserDetail } from '../dto/admin-user.dto';
import type { IGetAdminUserByIdUseCase } from '../ports/input/admin-user-management.usecase';
import type { IAdminUserManagementRepository } from '../ports/output/admin-user-management.repository';

export class GetAdminUserByIdUseCase implements IGetAdminUserByIdUseCase {
  constructor(private readonly repository: IAdminUserManagementRepository) {}

  async execute(userId: string): Promise<AdminUserDetail> {
    const user = await this.repository.getUserById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return user;
  }
}
