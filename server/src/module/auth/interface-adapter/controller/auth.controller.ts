import {
  IAuth,
  RegisterCommand,
} from '../../applications/interfaces/auth.interface';
import {
  IAuthPresenter,
  RegisterResponse,
} from '../presenter/auth-presenter.interface';

export class AuthController {
  private readonly authUseCase: IAuth;
  private readonly authPresenter: IAuthPresenter;

  constructor(authUseCase: IAuth, authPresenter: IAuthPresenter) {
    this.authUseCase = authUseCase;
    this.authPresenter = authPresenter;
  }

  async register(command: RegisterCommand): Promise<RegisterResponse> {
    const user = await this.authUseCase.register(command);
    return this.authPresenter.toResponse(user);
  }
}
