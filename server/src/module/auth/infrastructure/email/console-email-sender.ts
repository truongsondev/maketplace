import { IEmailSender, EmailOptions } from '../../applications/ports';
import { OtpEmailTemplate } from './otp-email.template';
import nodemailer from 'nodemailer';

export class EmailSender implements IEmailSender {
  private readonly otpTemplate: OtpEmailTemplate;

  constructor(templateOptions?: {
    appName?: string;
    expiresInMinutes?: number;
    supportUrl?: string;
  }) {
    this.otpTemplate = new OtpEmailTemplate(templateOptions);
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

  async sendOtpEmail(to: string, otp: string): Promise<void> {
    const html = this.otpTemplate.generate(otp);
    const subject = this.otpTemplate.getSubject();

    await this.send({ to, subject, html });
  }
}
