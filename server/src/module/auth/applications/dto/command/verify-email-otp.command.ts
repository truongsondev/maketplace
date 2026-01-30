/**
 * Command DTO for verifying OTP and completing registration
 */
export interface VerifyEmailOtpCommand {
  readonly email: string;
  readonly otp: string;
}
