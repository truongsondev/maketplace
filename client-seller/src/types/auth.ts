export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    token: {
      accessToken: string;
      refreshToken: string;
    };
    user: {
      id: string;
      email: string;
      fullName: string;
      avatarUrl: string | null;
      roles: string[];
    };
  };
  message: string;
  timestamp: string;
}

export interface User {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string | null;
  roles: string[];
  emailVerified?: boolean;
  status?: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
