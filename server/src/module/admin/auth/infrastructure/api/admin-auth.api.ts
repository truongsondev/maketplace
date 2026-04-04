import express, { Request, Response, NextFunction } from 'express';
import { BadRequestError } from '../../../../../error-handlling/badRequestError';
import { asyncHandler } from '../../../../../shared/server/error-middleware';
import { ResponseFormatter } from '../../../../../shared/server/api-response';
import { HttpErrorHandler } from '../../../../../shared/server/http-error-handler';
import { AdminAuthController } from '../../interface-adapter';

export class AdminAuthAPI {
  readonly router = express.Router();

  constructor(private readonly adminAuthController: AdminAuthController) {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post('/login', asyncHandler(this.login.bind(this)));
  }

  private async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { email, password } = req.body;

    HttpErrorHandler.validateRequired({ email, password }, 'email', 'password');
    HttpErrorHandler.validateEmail(email);

    if (typeof password !== 'string' || password.length < 6) {
      throw new BadRequestError('Password must be at least 6 characters long');
    }

    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const deviceInfo = (req.headers['user-agent'] ?? 'unknown').slice(0, 500);

    const result = await this.adminAuthController.login({ email, password, deviceInfo }, ipAddress);
    const response = ResponseFormatter.success(result, 'Admin login successful');

    res.status(200).json(response);
  }
}
