import express, { Request, Response, NextFunction } from 'express';
import { ResponseFormatter } from '../../../../shared/server/api-response';
import { HttpErrorHandler } from '../../../../shared/server/http-error-handler';
import { BadRequestError } from '../../../../error-handlling/badRequestError';
import { asyncHandler } from '../../../../shared/server/error-middleware';
import { AuthController } from '../../interface-adapter/controller/auth.controller';

export class AuthAPI {
  readonly router = express.Router();

  constructor(private readonly authController: AuthController) {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post('/register', asyncHandler(this.register.bind(this)));
    this.router.get('/verify-email', asyncHandler(this.verifyEmail.bind(this)));
    this.router.post('/login', asyncHandler(this.login.bind(this)));
    this.router.post('/logout', asyncHandler(this.logout.bind(this)));
    this.router.post('/forgot-password', asyncHandler(this.forgotPassword.bind(this)));
    this.router.post('/reset-password', asyncHandler(this.resetPassword.bind(this)));
  }

  private validateRegisterInput(email: string, password: string): void {
    HttpErrorHandler.validateRequired({ email, password }, 'email', 'password');
    HttpErrorHandler.validateEmail(email);

    if (password.length < 6) {
      throw new BadRequestError('Password must be at least 6 characters long');
    }
  }

  private async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { email, password } = req.body;

    this.validateRegisterInput(email, password);

    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';

    const result = await this.authController.register({ email, password }, ipAddress);
    const response = ResponseFormatter.success(result, result.message);
    res.status(201).json(response);
  }

  private async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      throw new BadRequestError('Token is required');
    }

    const result = await this.authController.verifyEmail({ token });
    const response = ResponseFormatter.success(result, result.message);
    res.status(200).json(response);
  }

  private async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { email, password } = req.body;

    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const deviceInfo = (req.headers['user-agent'] ?? 'unknown').slice(0, 500);

    const result = await this.authController.login({ email, password, deviceInfo }, ipAddress);
    const response = ResponseFormatter.success(result, 'Login successful');
    res.status(200).json(response);
  }

  private async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
      throw new BadRequestError('Email is required');
    }

    HttpErrorHandler.validateEmail(email);

    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';

    const result = await this.authController.forgotPassword({ email }, ipAddress);
    const response = ResponseFormatter.success(result, result.message);
    res.status(200).json(response);
  }

  private async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { token, newPassword } = req.body;

    if (!token || typeof token !== 'string') {
      throw new BadRequestError('Token is required');
    }
    if (!newPassword || typeof newPassword !== 'string') {
      throw new BadRequestError('New password is required');
    }
    if (newPassword.length < 6) {
      throw new BadRequestError('Password must be at least 6 characters long');
    }

    const result = await this.authController.resetPassword({ token, newPassword });
    const response = ResponseFormatter.success(result, result.message);
    res.status(200).json(response);
  }

  private async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new BadRequestError('Authorization header is required');
    }

    const accessToken = authHeader.slice('Bearer '.length);
    const { refreshToken } = req.body as { refreshToken?: string };

    const result = await this.authController.logout({ accessToken, refreshToken });
    const response = ResponseFormatter.success(result, result.message);
    res.status(200).json(response);
  }
}
