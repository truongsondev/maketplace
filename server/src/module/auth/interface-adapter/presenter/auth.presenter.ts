import { User } from '../../entities/user/user.entity';
import { IAuthPresenter, RegisterResponse } from './auth-presenter.interface';

export class AuthPresenter implements IAuthPresenter {
  // chỗ này phải config
  toResponse(user: User): RegisterResponse {
    return {
      email: user.email.getValue(),
      name: user.getName(),
    };
  }
}
