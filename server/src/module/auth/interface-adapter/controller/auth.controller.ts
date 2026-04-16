import {
  LoginCommand,
  RegisterCommand,
  VerifyEmailCommand,
  ForgotPasswordCommand,
  ResetPasswordCommand,
  LogoutCommand,
  RefreshTokenCommand,
  GoogleOAuthLoginCommand,
} from '../../applications/dto/command';
import {
  IVerifyEmailUseCase,
  IForgotPasswordUseCase,
  IResetPasswordUseCase,
  ILogoutUseCase,
  IRefreshTokenUseCase,
  IGoogleOAuthLoginUseCase,
} from '../../applications/ports/input';
import { ILoginUseCaseFactory } from '../pattern/login-usecase.factory';
import { IRegisterUseCaseFactory } from '../pattern/register-usecase.factory';
import { IForgotPasswordUseCaseFactory } from '../pattern/forgot-password-usecase.factory';

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
    private readonly loginUseCaseFactory: ILoginUseCaseFactory,
    private readonly forgotPasswordUseCaseFactory: IForgotPasswordUseCaseFactory,
    private readonly resetPasswordUseCase: IResetPasswordUseCase,
    private readonly logoutUseCase: ILogoutUseCase,
    private readonly refreshTokenUseCase: IRefreshTokenUseCase,
    private readonly googleOAuthLoginUseCase: IGoogleOAuthLoginUseCase,
  ) {}

  async register(command: RegisterCommand, ipAddress?: string): Promise<RegisterHttpResponse> {
    const registerUseCase = this.registerUseCaseFactory.create(ipAddress);
    const result = await registerUseCase.execute(command);
    return result;
  }

  async verifyEmail(command: VerifyEmailCommand): Promise<VerifyEmailHttpResponse> {
    const result = await this.verifyEmailUseCase.execute(command);
    return result;
  }

  async login(command: LoginCommand, ipAddress?: string) {
    const loginUseCase = this.loginUseCaseFactory.create(ipAddress);
    const result = await loginUseCase.execute(command);
    return result;
  }

  async forgotPassword(command: ForgotPasswordCommand, ipAddress?: string) {
    const useCase = this.forgotPasswordUseCaseFactory.create(ipAddress);
    return useCase.execute(command);
  }

  async resetPassword(command: ResetPasswordCommand) {
    return this.resetPasswordUseCase.execute(command);
  }

  async logout(command: LogoutCommand) {
    return this.logoutUseCase.execute(command);
  }

  async refreshToken(command: RefreshTokenCommand) {
    return this.refreshTokenUseCase.execute(command);
  }

  async googleOAuthLogin(command: GoogleOAuthLoginCommand) {
    return this.googleOAuthLoginUseCase.execute(command);
  }
}
