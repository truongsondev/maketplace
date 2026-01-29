import { User } from '../../entities/user/user.entity';
import { Email } from '../../entities/value-object/email.vo';
import { UserAlreadyExistsError } from '../errors/user-already-exists.error';
import { PasswordHasher } from '../interfaces/password-hasher.interface';
import { IAuth, RegisterCommand } from '../interfaces/auth.interface';
import { IUserRepo } from '../interfaces/user.interface';

export class AuthUseCase implements IAuth {
  private readonly userRepo: IUserRepo;
  private readonly passwordHasher: PasswordHasher;

  constructor(userRepo: IUserRepo, passwordHasher: PasswordHasher) {
    this.userRepo = userRepo;
    this.passwordHasher = passwordHasher;
  }

  async register(command: RegisterCommand): Promise<User> {
    const { email, password, name, yob } = command;
    const existingUser = await this.userRepo.findUserByEmail(email);
    if (existingUser) {
      throw new UserAlreadyExistsError();
    }

    const emailVO = new Email(email);
    const birthDate = yob instanceof Date ? yob : new Date(yob);
    const passwordHash = await this.passwordHasher.hash(password);

    const user = User.register(
      emailVO,
      passwordHash,
      name,
      birthDate,
      new Date().getFullYear(),
    );

    await this.userRepo.save(emailVO.getValue(), passwordHash, name, birthDate);
    return user;
  }
}
