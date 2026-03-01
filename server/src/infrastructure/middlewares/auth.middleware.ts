import { Request, Response, NextFunction } from 'express';
import { ISessionVerifier } from '../../shared/server/session-verifier';
import { ResponseFormatter } from '../../shared/server/api-response';
import { ErrorCode } from '../../shared/server/error-codes';

export function createAuthMiddleware(sessionVerifier: ISessionVerifier) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (req.path.startsWith('/api/auth') || req.path.startsWith('/api/products')) {
      return next();
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res
        .status(401)
        .json(
          ResponseFormatter.error(
            ErrorCode.UNAUTHORIZED,
            'Missing or malformed Authorization header. Expected: Bearer <token>',
          ),
        );
      return;
    }

    const token = authHeader.slice('Bearer '.length);

    const userId = await sessionVerifier.verifySession(token);

    if (!userId) {
      res
        .status(401)
        .json(
          ResponseFormatter.error(
            ErrorCode.INVALID_TOKEN,
            'Access token is invalid or has expired. Please login again.',
          ),
        );
      return;
    }

    req.userId = userId;

    next();
  };
}
