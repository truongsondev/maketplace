import { Request, Response, NextFunction } from 'express';
import { ISessionVerifier } from '../../shared/server/session-verifier';
import { ResponseFormatter } from '../../shared/server/api-response';
import { ErrorCode } from '../../shared/server/error-codes';
import { prisma } from '../database';

export function createAuthMiddleware(sessionVerifier: ISessionVerifier) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Public endpoints (không yêu cầu access token)
    const requestPath = req.originalUrl || req.path;
    const isPublicEndpoint =
      requestPath.startsWith('/api/auth') ||
      requestPath.startsWith('/api/products') ||
      req.path.startsWith('/api/auth') ||
      req.path.startsWith('/api/products');

    // Bỏ qua preflight request
    if (req.method === 'OPTIONS' || isPublicEndpoint) {
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

    // Query user with roles from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      res
        .status(401)
        .json(
          ResponseFormatter.error(ErrorCode.UNAUTHORIZED, 'User not found or has been deleted'),
        );
      return;
    }

    (req as any).user = {
      id: user.id,
      email: user.email,
      status: user.status,
      roles: user.userRoles,
    };

    req.userId = userId;

    next();
  };
}
