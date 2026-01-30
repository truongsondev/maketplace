export class OtpEmailTemplate {
  private readonly appName: string;
  private readonly expiresInMinutes: number;
  private readonly supportUrl: string;
  private readonly websiteUrl: string;
  private readonly privacyUrl: string;
  private readonly helpCenterUrl: string;

  constructor(options?: {
    appName?: string;
    expiresInMinutes?: number;
    supportUrl?: string;
    websiteUrl?: string;
    privacyUrl?: string;
    helpCenterUrl?: string;
  }) {
    this.appName = options?.appName || 'Marketplace';
    this.expiresInMinutes = options?.expiresInMinutes || 10;
    this.supportUrl = options?.supportUrl || '#';
    this.websiteUrl = options?.websiteUrl || '#';
    this.privacyUrl = options?.privacyUrl || '#';
    this.helpCenterUrl = options?.helpCenterUrl || '#';
  }

  generate(otp: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta content="width=device-width, initial-scale=1.0" name="viewport"/>
  <title>Your Verification Code - ${this.appName}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f6f6f8;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    .container {
      display: flex;
      min-height: 100vh;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }
    .email-card {
      width: 100%;
      max-width: 450px;
      background-color: #ffffff;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      border: 1px solid #e5e7eb;
      overflow: hidden;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px 24px 8px;
      gap: 8px;
    }
    .logo {
      background-color: #135bec;
      width: 32px;
      height: 32px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 18px;
    }
    .brand-name {
      color: #111318;
      font-size: 18px;
      font-weight: 700;
      letter-spacing: -0.015em;
    }
    .headline {
      padding: 24px 24px 12px;
      text-align: center;
    }
    .headline h1 {
      color: #111318;
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .body-text {
      padding: 4px 32px 24px;
      text-align: center;
    }
    .body-text p {
      color: #4b5563;
      font-size: 16px;
      line-height: 1.6;
    }
    .body-text .highlight {
      font-weight: 600;
      color: #111318;
    }
    .otp-container {
      padding: 16px 24px;
    }
    .otp-box {
      background-color: #f9fafb;
      border-radius: 12px;
      padding: 32px;
      border: 1px solid #f3f4f6;
      text-align: center;
    }
    .otp-code {
      color: #135bec;
      font-size: 36px;
      font-family: 'Courier New', Courier, monospace;
      font-weight: 700;
      letter-spacing: 0.2em;
    }
    .security-notice {
      padding: 16px 32px 32px;
      text-align: center;
    }
    .security-notice p {
      color: #6b7280;
      font-size: 14px;
      line-height: 1.5;
    }
    .security-notice a {
      color: #135bec;
      text-decoration: none;
    }
    .security-notice a:hover {
      text-decoration: underline;
    }
    .footer {
      background-color: #f9fafb;
      border-top: 1px solid #f3f4f6;
      padding: 32px;
    }
    .social-links {
      display: flex;
      justify-content: center;
      gap: 24px;
      padding-bottom: 24px;
    }
    .social-links a {
      color: #9ca3af;
      text-decoration: none;
      font-size: 20px;
    }
    .social-links a:hover {
      color: #135bec;
    }
    .footer-links {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      font-weight: 500;
    }
    .footer-links .link-row {
      display: flex;
      gap: 16px;
    }
    .footer-links a {
      color: #6b7280;
      text-decoration: none;
    }
    .footer-links a:hover {
      color: #135bec;
    }
    .footer-links .separator {
      color: #d1d5db;
    }
    .copyright {
      margin-top: 16px;
      font-size: 10px;
      text-transform: none;
      letter-spacing: normal;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="email-card">
      <!-- Header Logo -->
      <div class="header">
        <div class="logo">🏪</div>
        <h2 class="brand-name">${this.appName}</h2>
      </div>

      <!-- Headline -->
      <div class="headline">
        <h1>Your Verification Code</h1>
      </div>

      <!-- Body Text -->
      <div class="body-text">
        <p>
          Use the code below to complete your sign-in or transaction. 
          This code will expire in <span class="highlight">${this.expiresInMinutes} minutes</span>.
        </p>
      </div>

      <!-- OTP Display -->
      <div class="otp-container">
        <div class="otp-box">
          <span class="otp-code">${otp}</span>
        </div>
      </div>

      <!-- Security Notice -->
      <div class="security-notice">
        <p>
          If you did not request this code, please ignore this email or 
          <a href="${this.supportUrl}">contact support</a>.
        </p>
      </div>

      <!-- Footer -->
      <div class="footer">
        <div class="social-links">
          <a href="${this.websiteUrl}" title="Website">🌐</a>
          <a href="#" title="Share">📤</a>
          <a href="mailto:support@marketplace.com" title="Email">📧</a>
        </div>
        <div class="footer-links">
          <div class="link-row">
            <a href="${this.helpCenterUrl}">Help Center</a>
            <span class="separator">•</span>
            <a href="${this.privacyUrl}">Privacy Policy</a>
          </div>
          <p class="copyright">
            © ${new Date().getFullYear()} ${this.appName} Inc. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
  }

  getSubject(): string {
    return `Your ${this.appName} Verification Code`;
  }
}
