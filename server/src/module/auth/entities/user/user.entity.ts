import { Email } from '../value-object/email.vo';

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  BANNED = 'BANNED',
}

export interface UserProps {
  id?: string;
  email?: Email;
  passwordHash?: string;
  emailVerified?: boolean;
  status?: UserStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export class User {
  private readonly _id?: string;
  private _email?: Email;
  private _passwordHash?: string;
  private _emailVerified: boolean;
  private _status: UserStatus;

  private constructor(props: UserProps) {
    this._id = props.id;
    this._email = props.email;
    this._passwordHash = props.passwordHash;
    this._emailVerified = props.emailVerified ?? false;
    this._status = props.status ?? UserStatus.ACTIVE;
  }

  static registerWithEmail(email: Email, passwordHash: string): User {
    return new User({
      email,
      passwordHash,
      emailVerified: false,
      status: UserStatus.ACTIVE,
    });
  }

  static registerWithOAuth(email?: Email): User {
    if (!email) {
      throw new Error(
        'Either email or phone is required for OAuth registration',
      );
    }

    return new User({
      email,
      emailVerified: email ? true : false,
      status: UserStatus.ACTIVE,
    });
  }

  static fromPersistence(props: UserProps): User {
    return new User(props);
  }

  get id(): string | undefined {
    return this._id;
  }

  get email(): Email | undefined {
    return this._email;
  }

  get passwordHash(): string | undefined {
    return this._passwordHash;
  }

  get emailVerified(): boolean {
    return this._emailVerified;
  }

  get status(): UserStatus {
    return this._status;
  }

  verifyEmail(): void {
    if (!this._email) {
      throw new Error('No email to verify');
    }
    this._emailVerified = true;
  }

  changePassword(newPasswordHash: string): void {
    this._passwordHash = newPasswordHash;
  }

  linkEmail(email: Email): void {
    if (this._email) {
      throw new Error('Email already linked');
    }
    this._email = email;
    this._emailVerified = false;
  }

  suspend(): void {
    if (this._status === UserStatus.BANNED) {
      throw new Error('Cannot suspend a banned user');
    }
    this._status = UserStatus.SUSPENDED;
  }

  ban(): void {
    this._status = UserStatus.BANNED;
  }

  activate(): void {
    if (this._status === UserStatus.BANNED) {
      throw new Error('Cannot activate a banned user');
    }
    this._status = UserStatus.ACTIVE;
  }

  isActive(): boolean {
    return this._status === UserStatus.ACTIVE;
  }

  hasPassword(): boolean {
    return !!this._passwordHash;
  }
}
