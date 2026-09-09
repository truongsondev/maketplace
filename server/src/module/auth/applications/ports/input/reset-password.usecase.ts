import { ResetPasswordCommand, ResetPasswordResult } from '../../dto';

export interface IResetPasswordUseCase {
  execute(command: ResetPasswordCommand): Promise<ResetPasswordResult>;
}
