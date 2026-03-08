import { VerifyEmailCommand, VerifyEmailResult } from '../../dto';

export interface IVerifyEmailUseCase {
  execute(command: VerifyEmailCommand): Promise<VerifyEmailResult>;
}