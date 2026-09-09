import { IEmailSender, EmailOptions } from '../../applications/ports';
import nodemailer from 'nodemailer';

export class EmailSender implements IEmailSender {
  constructor() {}

  private resolveFrontendBaseUrl(): string {
    const configuredBaseUrl = process.env.FRONTEND_URL?.trim();

    if (configuredBaseUrl) {
      return configuredBaseUrl.endsWith('/') ? configuredBaseUrl.slice(0, -1) : configuredBaseUrl;
    }

    const configuredApiPublicUrl = process.env.API_PUBLIC_URL?.trim();
    if (configuredApiPublicUrl) {
      try {
        const parsed = new URL(configuredApiPublicUrl);
        parsed.port = '3000';
        return `${parsed.protocol}//${parsed.host}`;
      } catch {
        // ignore invalid API_PUBLIC_URL and continue fallback chain
      }
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error('FRONTEND_URL (or API_PUBLIC_URL) is required in production environment');
    }

    return 'http://localhost:3000';
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  async send(options: EmailOptions): Promise<void> {
    await this.transporter.sendMail({
      to: `${options.to}`,
      subject: options.subject,
      html: options.html,
    });

    console.log('========================================');
    console.log('📧 EMAIL SENT (Console Mode)');
    console.log('========================================');
    console.log(`To: ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log('----------------------------------------');
    console.log('HTML Content: [Email HTML rendered]');
    console.log('========================================');
  }

  async sendEmailVerification(email: string, token: string): Promise<void> {
    const frontendBaseUrl = this.resolveFrontendBaseUrl();
    const verifyUrl = `${frontendBaseUrl}/verify-email?token=${token}`;
    const html = `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <h2>Verify Your Email Address</h2>
        <p>Thank you for registering! Please click the button below to verify your email address:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}" 
             style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Verify Email
          </a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #007bff;">${verifyUrl}</p>
        <p><small>This link will expire in 30 minutes.</small></p>
      </div>
    `;

    await this.send({
      to: email,
      subject: 'Verify Your Email Address',
      html,
    });
  }

  async sendPasswordReset(email: string, token: string): Promise<void> {
    const resetUrl = `${this.resolveFrontendBaseUrl()}/auth/reset-password?token=${token}`;
    const html = `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <h2>Reset Your Password</h2>
        <p>We received a request to reset your password. Click the button below to choose a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}"
             style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #dc3545;">${resetUrl}</p>
        <p><small>This link will expire in 15 minutes. If you did not request a password reset, you can safely ignore this email.</small></p>
      </div>
    `;

    await this.send({
      to: email,
      subject: 'Reset Your Password',
      html,
    });
  }
}
