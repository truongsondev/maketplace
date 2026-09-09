import { LogoutCommand } from '../../dto/command/logout.command';
import { LogoutResult } from '../../dto/result/logout.result';

export interface ILogoutUseCase {
  execute(command: LogoutCommand): Promise<LogoutResult>;
}
