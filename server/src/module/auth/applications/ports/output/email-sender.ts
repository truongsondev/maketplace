/**
 * Email options for sending
 */
export interface EmailOptions {
  readonly to: string;
  readonly subject: string;
  readonly html: string;
}

/**
 * Output Port - Email Sender
 * Defines the contract for sending emails
 */
export interface IEmailSender {
  /**
   * Send an email
   * @param options - Email options including recipient, subject, and content
   */
  send(options: EmailOptions): Promise<void>;

  /**
   * Send OTP verification email
   * @param to - Recipient email address
   * @param otp - OTP code to send
   */
  sendOtpEmail(to: string, otp: string): Promise<void>;
}
