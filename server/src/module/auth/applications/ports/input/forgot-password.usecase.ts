import { ForgotPasswordCommand, ForgotPasswordResult } from '../../dto';

export interface IForgotPasswordUseCase {
  execute(command: ForgotPasswordCommand): Promise<ForgotPasswordResult>;
}
