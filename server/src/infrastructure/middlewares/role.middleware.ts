import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../../error-handlling/forbiddenError';
import { UnauthorizedError } from '../../error-handlling/unauthorizedError';

/**
 * Middleware kiểm tra user có role yêu cầu không
 * @param allowedRoles - Danh sách role được phép (vd: ['ADMIN', 'SUPER_ADMIN'])
 */
export const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    // Check nếu chưa authenticate
    if (!user) {
      throw new UnauthorizedError('Authentication required');
    }

    // Check nếu không có role
    if (!user.roles || !Array.isArray(user.roles) || user.roles.length === 0) {
      throw new ForbiddenError('No role assigned to user');
    }

    // Check role có trong danh sách cho phép không
    const hasRequiredRole = user.roles.some((userRole: any) =>
      allowedRoles.includes(userRole.role.code),
    );

    if (!hasRequiredRole) {
      throw new ForbiddenError(`Access denied. Required roles: ${allowedRoles.join(', ')}`);
    }

    next();
  };
};

/**
 * Shorthand cho admin role
 */
export const requireAdmin = requireRole('ADMIN');
