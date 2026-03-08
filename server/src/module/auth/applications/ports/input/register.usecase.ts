import { RegisterCommand, RegisterResult } from '../../dto';

export interface IRegisterUseCase {
  execute(command: RegisterCommand): Promise<RegisterResult>;
}