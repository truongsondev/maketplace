import { LoginCommand,LoginResult } from "../../dto";

export interface ILoginUseCase {
  execute(command: LoginCommand): Promise<LoginResult>;
}