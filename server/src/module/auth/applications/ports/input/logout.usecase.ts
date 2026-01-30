import { LogoutCommand } from '../../dto/command/logout.command';

/**
 * Input Port - Logout Use Case
 * Defines the contract for logging out a user (revoking refresh token)
 */
export interface ILogoutUseCase {
  execute(command: LogoutCommand): Promise<void>;
}
