import { Request, Response, NextFunction } from 'express';
import { HttpErrorHandler } from './http-error-handler';

export function errorHandlingMiddleware(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  console.error('Global Error Handler:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  HttpErrorHandler.handle(err, res, console);
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch((error) => {
      HttpErrorHandler.handle(error, res, console);
    });
  };
}
