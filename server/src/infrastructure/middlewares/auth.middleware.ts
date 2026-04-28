import { Request, Response, NextFunction } from 'express';
import { ISessionVerifier } from '../../shared/server/session-verifier';
import { ResponseFormatter } from '../../shared/server/api-response';
import { ErrorCode } from '../../shared/server/error-codes';
import { prisma } from '../database';

export function createAuthMiddleware(sessionVerifier: ISessionVerifier) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Public endpoints (không yêu cầu access token)
    const requestPath = req.originalUrl || req.path;

    // Protected product endpoints (require access token)
    const isRelatedFromMyOrdersEndpoint =
      req.method === 'GET' &&
      (requestPath.startsWith('/api/products/related/my-orders') ||
        req.path.startsWith('/api/products/related/my-orders'));

    const isFavoriteEndpoint =
      requestPath.startsWith('/api/products/favorites') ||
      /\/api\/products\/[^/]+\/favorite/.test(requestPath);
    const isFavoriteEndpointByPath =
      req.path.startsWith('/api/products/favorites') ||
      /\/api\/products\/[^/]+\/favorite/.test(req.path);

    const isPublicProductGet =
      req.method === 'GET' &&
      requestPath.startsWith('/api/products') &&
      !isFavoriteEndpoint &&
      !isRelatedFromMyOrdersEndpoint;
    const isPublicProductGetByPath =
      req.method === 'GET' &&
      req.path.startsWith('/api/products') &&
      !isFavoriteEndpointByPath &&
      !isRelatedFromMyOrdersEndpoint;
    const isPublicPayosPath =
      requestPath.startsWith('/api/payments/payos/webhook') ||
      requestPath.startsWith('/api/payments/payos/return') ||
      requestPath.startsWith('/api/payments/payos/orders/');
    const isPublicPayosPathByReqPath =
      req.path.startsWith('/api/payments/payos/webhook') ||
      req.path.startsWith('/api/payments/payos/return') ||
      req.path.startsWith('/api/payments/payos/orders/');
    const isPublicCommonPath =
      requestPath.startsWith('/api/common') || req.path.startsWith('/api/common');
    const isPublicMockOrdersPath =
      requestPath.startsWith('/api/mock/orders') || req.path.startsWith('/api/mock/orders');
    const isPublicEndpoint =
      requestPath.startsWith('/api/auth') ||
      isPublicProductGet ||
      isPublicPayosPath ||
      isPublicCommonPath ||
      isPublicMockOrdersPath ||
      req.path.startsWith('/api/auth') ||
      isPublicProductGetByPath ||
      isPublicPayosPathByReqPath ||
      isPublicCommonPath ||
      isPublicMockOrdersPath;

    // Bỏ qua preflight request
    if (req.method === 'OPTIONS' || isPublicEndpoint) {
      return next();
    }

    const isAdminNotificationSse =
      req.method === 'GET' &&
      (requestPath.startsWith('/api/admin/notifications/stream') ||
        req.path.startsWith('/api/admin/notifications/stream'));

    const queryToken =
      isAdminNotificationSse && typeof req.query.token === 'string' && req.query.token.trim()
        ? req.query.token.trim()
        : null;

    const authHeader =
      req.headers.authorization || (queryToken ? `Bearer ${queryToken}` : undefined);

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
