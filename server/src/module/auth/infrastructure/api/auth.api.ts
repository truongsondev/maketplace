import express, { Request, Response } from 'express';
import { BadRequestError } from '../../../../error-handlling/badRequestError';
import { ConflicError } from '../../../../error-handlling/conflicError';
import { CustomError } from '../../../../error-handlling/customError';
import { UserAlreadyExistsError } from '../../applications/errors/user-already-exists.error';
import { AuthController } from '../../interface-adapter/controller/auth.controller';

export class AuthAPI {
  readonly router = express.Router();
  private readonly authController: AuthController;

  constructor(authController: AuthController) {
    this.authController = authController;
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post('/register', async (req: Request, res: Response) => {
      try {
        const { email, password, name, yob } = req.body;
        if (!email || !password || !name || !yob) {
          throw new BadRequestError('Missing required fields');
        }

        const result = await this.authController.register({
          email,
          password,
          name,
          yob,
        });

        res.status(201).json(result);
      } catch (error) {
        this.handleError(error, res);
      }
    });
  }

  private handleError(error: unknown, res: Response) {
    if (error instanceof UserAlreadyExistsError) {
      const httpError = new ConflicError(error.message);
      return res
        .status(httpError.statusCode)
        .json({ message: httpError.message });
    }
    if (error instanceof CustomError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
}
