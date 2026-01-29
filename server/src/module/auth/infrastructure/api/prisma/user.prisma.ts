import { IUserRepo } from '../../../applications/interfaces/user.interface';
import { User } from '../../../entities/user/user.entity';
import { Email } from '../../../entities/value-object/email.vo';

export class UserPrisma implements IUserRepo {
  async findUserByEmail(email: string): Promise<User | null> {
    // TODO: Replace with real Prisma query
    return null;
  }

  async save(
    email: string,
    passwordHash: string,
    name: string,
    yob: Date,
  ): Promise<void> {
    // TODO: Replace with real Prisma mutation
    const _user = new User(new Email(email), passwordHash, name, yob);
    return Promise.resolve();
  }
}
