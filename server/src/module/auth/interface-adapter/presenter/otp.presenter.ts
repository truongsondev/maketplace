import { OTPResult } from '../../applications/dto/result/auth.result';
import { IOTPPresenter, OTPHttpResponse } from './otp-presenter.interface';

/**
 * Auth Presenter - transforms use case results to HTTP responses
 */
export class OTPPresenter implements IOTPPresenter {
  toHttpResponse(result: OTPResult): OTPHttpResponse {
    return {
      success: true,
      data: {
        status: result.status,
        message: result.message,
      },
    };
  }
}
