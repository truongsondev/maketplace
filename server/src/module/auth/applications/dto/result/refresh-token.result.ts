import { User } from '@/module/auth/entities/user/user.entity';
import { UserProfile } from '@/module/auth/entities/user/user-profile.entity';

export interface RefreshTokenResult {
  token: {
    accessToken: string;
    refreshToken: string;
  };
  user: User;
  profile?: UserProfile;
}
