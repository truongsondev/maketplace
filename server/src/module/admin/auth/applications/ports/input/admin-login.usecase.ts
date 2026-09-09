import { AdminLoginCommand, AdminLoginResult } from '../../dto';

export interface IAdminLoginUseCase {
  execute(command: AdminLoginCommand, ipAddress?: string): Promise<AdminLoginResult>;
}
