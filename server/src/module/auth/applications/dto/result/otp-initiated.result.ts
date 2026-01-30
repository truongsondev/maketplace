/**
 * Result DTO for OTP initiation
 */
export interface OtpInitiatedResult {
  readonly message: string;
  readonly email: string;
  readonly expiresInMinutes: number;
}
