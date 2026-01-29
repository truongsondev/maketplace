import { User } from '../../entities/user/user.entity';

export interface IUserRepo {
  findUserByEmail(email: string): Promise<User | null>;
  save(
    email: string,
    passwordHash: string,
    name: string,
    yob: Date,
  ): Promise<void>;
}
