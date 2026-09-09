export interface AdminLoginResult {
  token: {
    accessToken: string;
    refreshToken: string;
  };
  user: {
    id: string;
    email: string | null;
    fullName?: string;
    avatarUrl?: string;
    roles: string[];
  };
}
