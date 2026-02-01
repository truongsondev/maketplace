import { AuthResult } from '../../applications/dto/result/auth.result';
import { AuthHttpResponse, IAuthPresenter } from './auth-presenter.interface';

/**
 * Auth Presenter - transforms use case results to HTTP responses
 */
export class AuthPresenter implements IAuthPresenter {
  toHttpResponse(result: AuthResult): AuthHttpResponse {
    return {
      success: true,
      data: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: result.expiresIn,
        user: {
          id: result.user.id,
          email: result.user.email,
          phone: result.user.phone,
          emailVerified: result.user.emailVerified,
          phoneVerified: result.user.phoneVerified,
          status: result.user.status,
        },
      },
    };
  }
}
