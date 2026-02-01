import { AuthResult } from '../../applications/dto/result/auth.result';

/**
 * HTTP Response for authentication operations
 */
export interface AuthHttpResponse {
  success: boolean;
  data: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: {
      id: string;
      email?: string;
      phone?: string;
      emailVerified: boolean;
      phoneVerified: boolean;
      status: string;
    };
  };
}

/**
 * Presenter interface for auth responses
 */
export interface IAuthPresenter {
  toHttpResponse(result: AuthResult): AuthHttpResponse;
}
