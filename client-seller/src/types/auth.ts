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
      _id: string;
      _email: {
        value: string;
      };
      _emailVerified: boolean;
      _status: string;
    };
  };
  message: string;
  timestamp: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
  emailVerified?: boolean;
  status?: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
