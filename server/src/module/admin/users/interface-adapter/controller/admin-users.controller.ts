import type {
  ListAdminUserAuditsCommand,
  ListAdminUsersCommand,
  UpdateAdminUserRoleCommand,
  UpdateAdminUserStatusCommand,
} from '../../applications/dto/admin-user.dto';
import type {
  IExportAdminUsersUseCase,
  IGetAdminUserByIdUseCase,
  IListAdminUserAuditsUseCase,
  IListAdminUsersUseCase,
  ISetAdminUserRoleUseCase,
  ISetAdminUserStatusUseCase,
} from '../../applications/ports/input/admin-user-management.usecase';

export class AdminUsersController {
  constructor(
    private readonly listUseCase: IListAdminUsersUseCase,
    private readonly getByIdUseCase: IGetAdminUserByIdUseCase,
    private readonly setStatusUseCase: ISetAdminUserStatusUseCase,
    private readonly setRoleUseCase: ISetAdminUserRoleUseCase,
    private readonly listAuditsUseCase: IListAdminUserAuditsUseCase,
    private readonly exportUseCase: IExportAdminUsersUseCase,
  ) {}

  listUsers(params: ListAdminUsersCommand) {
    return this.listUseCase.execute(params);
  }

  getUserById(userId: string) {
    return this.getByIdUseCase.execute(userId);
  }

  setUserStatus(command: UpdateAdminUserStatusCommand) {
    return this.setStatusUseCase.execute(command);
  }

  setUserRole(command: UpdateAdminUserRoleCommand) {
    return this.setRoleUseCase.execute(command);
  }

  listUserAudits(command: ListAdminUserAuditsCommand) {
    return this.listAuditsUseCase.execute(command);
  }

  exportUsers(params: Omit<ListAdminUsersCommand, 'page' | 'limit'>) {
    return this.exportUseCase.execute(params);
  }
}
