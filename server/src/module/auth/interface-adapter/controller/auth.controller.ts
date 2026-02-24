import {
  RegisterCommand,
  VerifyEmailCommand,
} from '../../applications/dto/command';
import {
  IVerifyEmailUseCase,
} from '../../applications/ports/input';
import { IRegisterUseCaseFactory } from './register-usecase.factory';

export interface RegisterHttpResponse {
  message: string;
}

export interface VerifyEmailHttpResponse {
  message: string;
}

export class AuthController {
  constructor(
    private readonly registerUseCaseFactory: IRegisterUseCaseFactory,
    private readonly verifyEmailUseCase: IVerifyEmailUseCase,
  ) {}

  async register(
    command: RegisterCommand,
    ipAddress?: string,
  ): Promise<RegisterHttpResponse> {
    const registerUseCase = this.registerUseCaseFactory.create(ipAddress);
    const result = await registerUseCase.execute(command);
    return result;
  }

  async verifyEmail(
    command: VerifyEmailCommand,
  ): Promise<VerifyEmailHttpResponse> {
    const result = await this.verifyEmailUseCase.execute(command);
    return result;
  }
}
