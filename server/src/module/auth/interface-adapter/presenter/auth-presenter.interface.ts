import { User } from '../../entities/user/user.entity';

export type RegisterResponse = { email: string; name: string };

export interface IAuthPresenter {
  toResponse(user: User): RegisterResponse;
}
