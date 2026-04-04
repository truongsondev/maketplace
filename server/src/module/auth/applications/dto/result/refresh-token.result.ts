import { User } from '@/module/auth/entities/user/user.entity';

export interface RefreshTokenResult {
  token: {
    accessToken: string;
    refreshToken: string;
  };
  user: User;
}
