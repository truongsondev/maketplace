import { VerifyEmailOtpCommand } from '../../dto/command/verify-email-otp.command';
import { AuthResult, OTPResult } from '../../dto/result/auth.result';

/**
 * Input Port - Verify Email OTP Use Case
 * Defines the contract for verifying OTP and completing registration
 */
export interface IVerifyEmailOtpUseCase {
  execute(command: VerifyEmailOtpCommand): Promise<OTPResult>;
}
