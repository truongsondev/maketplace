import { OTPResult } from '../../applications/dto/result/auth.result';

export interface OTPHttpResponse {
  success: boolean;
  data: {
    status: boolean;
    message: string;
  };
}

/**
 * Presenter interface for auth responses
 */
export interface IOTPPresenter {
  toHttpResponse(result: OTPResult): OTPHttpResponse;
}
