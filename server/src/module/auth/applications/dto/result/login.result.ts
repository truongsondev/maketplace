import { User } from '@/module/auth/entities/user/user.entity';

export interface LoginResult {
  token: {
    accessToken: string;
    refreshToken: string;
  };
  user: User;
}
