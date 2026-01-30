import { ResendOtpCommand } from '../../dto/command/resend-otp.command';
import { OtpInitiatedResult } from '../../dto/result/otp-initiated.result';

/**
 * Input Port - Resend OTP Use Case
 * Defines the contract for resending OTP email
 */
export interface IResendOtpUseCase {
  execute(command: ResendOtpCommand): Promise<OtpInitiatedResult>;
}
