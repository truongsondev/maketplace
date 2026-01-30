import express, { Request, Response, NextFunction } from 'express';
import { BadRequestError } from '../../../../error-handlling/badRequestError';
import { ConflicError } from '../../../../error-handlling/conflicError';
import { CustomError } from '../../../../error-handlling/customError';
import {
  EmailAlreadyExistsError,
  PhoneAlreadyExistsError,
} from '../../applications/errors';
import { AuthController } from '../../interface-adapter/controller/auth.controller';

/**
 * Auth API - Express routes for authentication
 */
export class AuthAPI {
  readonly router = express.Router();

  constructor(private readonly authController: AuthController) {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post('/register/email', this.registerWithEmail.bind(this));

    this.router.post('/register/phone', this.registerWithPhone.bind(this));
    this.router.post(
      '/verify-email-otp',
      async (req: Request, res: Response) => {
        res.status(200).json({ message: 'Not implemented yet' });
      },
    );
  }

  private async registerWithEmail(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        throw new BadRequestError('Email and password are required');
      }

      if (password.length < 8) {
        throw new BadRequestError('Password must be at least 8 characters');
      }

      const result = await this.authController.registerWithEmail({
        email,
        password,
      });
      res.status(201).json(result);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private async registerWithPhone(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { phone, password } = req.body;

      if (!phone || !password) {
        throw new BadRequestError('Phone and password are required');
      }

      if (password.length < 8) {
        throw new BadRequestError('Password must be at least 8 characters');
      }

      const result = await this.authController.registerWithPhone({
        phone,
        password,
      });
      res.status(201).json(result);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private async verifyOTP(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const { email, otp } = req.body;
    res.status(200).json({ message: 'Not implemented yet' });
  }

  private handleError(error: unknown, res: Response): void {
    if (error instanceof EmailAlreadyExistsError) {
      const httpError = new ConflicError(error.message);
      res.status(httpError.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
      return;
    }

    if (error instanceof PhoneAlreadyExistsError) {
      const httpError = new ConflicError(error.message);
      res.status(httpError.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
      return;
    }

    if (error instanceof CustomError) {
      res.status(error.statusCode).json({
        success: false,
        error: {
          message: error.message,
        },
      });
      return;
    }

    if (error instanceof Error) {
      if (
        error.message.includes('Invalid email') ||
        error.message.includes('Invalid phone')
      ) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message,
          },
        });
        return;
      }
    }

    console.error('Unhandled error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error',
      },
    });
  }
}
