export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

export interface UserProfileProps {
  userId: string;
  fullName?: string;
  avatarUrl?: string;
  gender?: Gender;
  birthday?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class UserProfile {
  private readonly _userId: string;
  private _fullName?: string;
  private _avatarUrl?: string;
  private _gender?: Gender;
  private _birthday?: Date;
  private readonly _createdAt?: Date;
  private readonly _updatedAt?: Date;

  private constructor(props: UserProfileProps) {
    this._userId = props.userId;
    this._fullName = props.fullName;
    this._avatarUrl = props.avatarUrl;
    this._gender = props.gender;
    this._birthday = props.birthday;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  static create(props: UserProfileProps): UserProfile {
    return new UserProfile(props);
  }

  static fromPersistence(props: UserProfileProps): UserProfile {
    return new UserProfile(props);
  }

  get userId(): string {
    return this._userId;
  }

  get fullName(): string | undefined {
    return this._fullName;
  }

  get avatarUrl(): string | undefined {
    return this._avatarUrl;
  }

  get gender(): Gender | undefined {
    return this._gender;
  }

  get birthday(): Date | undefined {
    return this._birthday;
  }

  get createdAt(): Date | undefined {
    return this._createdAt;
  }

  get updatedAt(): Date | undefined {
    return this._updatedAt;
  }

  updateFullName(fullName: string): void {
    this._fullName = fullName;
  }

  updateAvatarUrl(avatarUrl: string): void {
    this._avatarUrl = avatarUrl;
  }

  updateGender(gender: Gender): void {
    this._gender = gender;
  }

  updateBirthday(birthday: Date): void {
    this._birthday = birthday;
  }
}
