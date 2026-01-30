/**
 * OTP data structure
 */
export interface OtpData {
  readonly email: string;
  readonly otp: string;
  readonly password: string;
  readonly expiresAt: Date;
  readonly attempts: number;
}

/**
 * Output Port - OTP Repository
 * Defines the contract for OTP storage operations
 */
export interface IOtpRepository {
  /**
   * Save OTP data for email verification
   * @param data - OTP data to save
   */
  save(data: OtpData): Promise<void>;

  /**
   * Find OTP data by email
   * @param email - Email address
   * @returns OTP data or null if not found
   */
  findByEmail(email: string): Promise<OtpData | null>;

  /**
   * Delete OTP data by email
   * @param email - Email address
   */
  deleteByEmail(email: string): Promise<void>;

  /**
   * Increment attempt count for an email
   * @param email - Email address
   */
  incrementAttempts(email: string): Promise<void>;
}
