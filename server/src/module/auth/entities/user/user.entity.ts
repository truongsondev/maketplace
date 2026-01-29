import { PasswordHasher } from '../../applications/interfaces/password-hasher.interface';
import { Email } from '../value-object/email.vo';

export class User {
  constructor(
    public readonly email: Email,
    private passwordHash: string,
    private name: string,
    private yob: Date,
  ) {}

  static register(
    email: Email,
    passwordHash: string,
    name: string,
    yob: Date,
    currentYear: number,
  ): User {
    if (name.length < 1 || name.length > 50) {
      throw new Error('Invalid name length');
    }

    const age = currentYear - yob.getFullYear();
    if (age < 0 || age > 100) {
      throw new Error('Invalid age range');
    }

    return new User(email, passwordHash, name, yob);
  }

  getName(): string {
    return this.name;
  }
}
