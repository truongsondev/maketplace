import { Request, Response, NextFunction } from 'express';
import { createLogger } from '@/shared/util/logger';

const logger = createLogger('HTTP');

export function requestLoggingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  const { method, originalUrl, ip } = req;

  logger.http(`${method} ${originalUrl}`, {
    method,
    url: originalUrl,
    ip,
    userAgent: req.get('user-agent'),
    userId: (req as any).userId || 'anonymous',
  });

  const originalSend = res.send;
  res.send = function (data: any): Response {
    res.send = originalSend;

    const duration = Date.now() - startTime;
    const { statusCode } = res;

    const statusCategory = statusCode >= 500 ? '❌' : statusCode >= 400 ? '⚠️' : '✓';

    logger.http(`${method} ${originalUrl} ${statusCategory} ${statusCode} - ${duration}ms`, {
      method,
      url: originalUrl,
      statusCode,
      duration: `${duration}ms`,
      userId: (req as any).userId || 'anonymous',
    });

    return originalSend.call(this, data);
  };

  next();
}
