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
    this.router.post(
      '/register',
      asyncHandler(this.register.bind(this)),
    );
    this.router.get(
      '/verify-email',
      asyncHandler(this.verifyEmail.bind(this)),
    );
  }

  private validateRegisterInput(email: string, password: string): void {
    HttpErrorHandler.validateRequired({ email, password }, 'email', 'password');
    HttpErrorHandler.validateEmail(email);
    
    if (password.length < 6) {
      throw new BadRequestError('Password must be at least 6 characters long');
    }
  }

  private async register(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const { email, password } = req.body;

    this.validateRegisterInput(email, password);

    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';

    const result = await this.authController.register({ email, password }, ipAddress);
    const response = ResponseFormatter.success(result, result.message);
    res.status(201).json(response);
  }

  private async verifyEmail(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      throw new BadRequestError('Token is required');
    }

    const result = await this.authController.verifyEmail({ token });
    const response = ResponseFormatter.success(result, result.message);
    res.status(200).json(response);
  }
}
