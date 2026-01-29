import { User } from '../../entities/user/user.entity';

export type RegisterCommand = {
  email: string;
  password: string;
  name: string;
  yob: string | Date;
};

export interface IAuth {
  register(command: RegisterCommand): Promise<User>;
  //   login(email: string, password: string): Promise<string>;
  //   verifyOTP(email: string, otp: string): Promise<boolean>;
  //   forgetPassword(email: string): Promise<void>;
  //   changePassword(
  //     email: string,
  //     oldPassword: string,
  //     newPassword: string,
  //   ): Promise<void>;
}
