import { AdminLoginCommand } from '../../applications/dto';
import { IAdminLoginUseCase } from '../../applications/ports/input';

export class AdminAuthController {
  constructor(private readonly adminLoginUseCase: IAdminLoginUseCase) {}

  async login(command: AdminLoginCommand, ipAddress?: string) {
    return this.adminLoginUseCase.execute(command, ipAddress);
  }
}
