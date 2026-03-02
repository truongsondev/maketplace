import { Request, Response, NextFunction } from 'express';
import { HttpErrorHandler } from './http-error-handler';
import { createLogger } from '../util/logger';

const logger = createLogger('ErrorMiddleware');

export function errorHandlingMiddleware(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  logger.error('Request error occurred', err, {
    path: req.path,
    method: req.method,
    query: req.query,
    body: req.body,
    userId: (req as any).userId || 'anonymous',
  });

  HttpErrorHandler.handle(err, res, logger);
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch((error) => {
      logger.error('Async handler caught error', error, {
        path: req.path,
        method: req.method,
      });
      HttpErrorHandler.handle(error, res, logger);
    });
  };
}
