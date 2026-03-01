export interface EmailOptions {
  readonly to: string;
  readonly subject: string;
  readonly html: string;
}

export interface IEmailSender {
  send(options: EmailOptions): Promise<void>;

  sendEmailVerification(email: string, token: string): Promise<void>;

  sendPasswordReset(email: string, token: string): Promise<void>;
}
