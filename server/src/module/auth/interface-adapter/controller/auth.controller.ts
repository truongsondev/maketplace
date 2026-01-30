import {
  RegisterWithEmailCommand,
  RegisterWithPhoneCommand,
  VerifyEmailOtpCommand,
} from '../../applications/dto/command';
import {
  IRegisterWithEmailUseCase,
  IRegisterWithPhoneUseCase,
  IVerifyEmailOtpUseCase,
} from '../../applications/ports/input';
import {
  AuthHttpResponse,
  IAuthPresenter,
} from '../presenter/auth-presenter.interface';
import {
  IOTPPresenter,
  OTPHttpResponse,
} from '../presenter/otp-presenter.interface';

/**
 * Auth Controller - handles HTTP request/response for auth operations
 */
export class AuthController {
  constructor(
    private readonly registerWithEmailUseCase: IRegisterWithEmailUseCase,
    private readonly registerWithPhoneUseCase: IRegisterWithPhoneUseCase,
    private readonly verifyEmailOtpUseCase: IVerifyEmailOtpUseCase,
    private readonly presenter: IAuthPresenter,
    private readonly otpPresenter: IOTPPresenter,
  ) {}

  async registerWithEmail(
    command: RegisterWithEmailCommand,
  ): Promise<AuthHttpResponse> {
    const result = await this.registerWithEmailUseCase.execute(command);
    return this.presenter.toHttpResponse(result);
  }

  async registerWithPhone(
    command: RegisterWithPhoneCommand,
  ): Promise<AuthHttpResponse> {
    const result = await this.registerWithPhoneUseCase.execute(command);
    return this.presenter.toHttpResponse(result);
  }

  async verifyEmailOtp(
    command: VerifyEmailOtpCommand,
  ): Promise<OTPHttpResponse> {
    const result = await this.verifyEmailOtpUseCase.execute(command);
    return this.otpPresenter.toHttpResponse(result);
  }
}
