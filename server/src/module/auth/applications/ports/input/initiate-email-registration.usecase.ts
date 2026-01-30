import { InitiateEmailRegistrationCommand } from '../../dto/command/send-otp-via-email.command';
import { OtpInitiatedResult } from '../../dto/result/otp-initiated.result';

/**
 * Input Port - Initiate Email Registration Use Case
 * Defines the contract for initiating email registration with OTP
 */
export interface IInitiateEmailRegistrationUseCase {
  execute(
    command: InitiateEmailRegistrationCommand,
  ): Promise<OtpInitiatedResult>;
}
