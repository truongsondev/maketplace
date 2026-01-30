import { User } from '../../../entities/user/user.entity';

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;

  findByPhone(phone: string): Promise<User | null>;

  findById(id: string): Promise<User | null>;

  save(user: User): Promise<User>;

  existsByEmail(email: string): Promise<boolean>;

  existsByPhone(phone: string): Promise<boolean>;
}
