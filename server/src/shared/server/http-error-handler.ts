import { Response } from 'express';
import { ResponseFormatter, ApiErrorResponse } from './api-response';
import { ErrorCode, ErrorCodeType, getStatusCodeFromErrorCode } from './error-codes';
import { CustomError } from '../../error-handlling/customError';
import { BadRequestError } from '../../error-handlling/badRequestError';
import { ConflicError } from '../../error-handlling/conflicError';
import { NotFoundError } from '../../error-handlling/notFoundError';
import { ForbiddenError } from '../../error-handlling/forbiddenError';

export interface ApplicationError extends Error {
  code?: string;
}

export class HttpErrorHandler {
  static handle(error: unknown, res: Response, logger?: any): ApiErrorResponse {
    // Don't log here anymore - let the middleware handle it

    let errorCode: ErrorCodeType = ErrorCode.INTERNAL_SERVER_ERROR;
    let message: string = 'Internal server error';
    let details: Record<string, any> | undefined;
    let statusCode: number = 500;

    if (error instanceof CustomError) {
      statusCode = error.statusCode;
      message = error.message;

      if (error.statusCode === 400) {
        errorCode = ErrorCode.VALIDATION_ERROR;
      } else if (error.statusCode === 401) {
        errorCode = ErrorCode.UNAUTHORIZED;
      } else if (error.statusCode === 404) {
        errorCode = ErrorCode.NOT_FOUND;
      } else if (error.statusCode === 409) {
        errorCode = ErrorCode.CONFLICT;
      } else if (error.statusCode === 403) {
        errorCode = ErrorCode.FORBIDDEN;
      }
    } else if (error instanceof BadRequestError) {
      errorCode = ErrorCode.VALIDATION_ERROR;
      message = error.message;
      statusCode = 400;
    } else if (error instanceof ConflicError) {
      errorCode = ErrorCode.CONFLICT;
      message = error.message;
      statusCode = 409;
    } else if (error instanceof NotFoundError) {
      errorCode = ErrorCode.NOT_FOUND;
      message = error.message;
      statusCode = 404;
    } else if (error instanceof ForbiddenError) {
      errorCode = ErrorCode.FORBIDDEN;
      message = error.message;
      statusCode = 403;
    } else if (
      error instanceof Error &&
      'code' in error &&
      typeof (error as ApplicationError).code === 'string'
    ) {
      const appError = error as ApplicationError;
      errorCode = (appError.code as ErrorCodeType) || ErrorCode.INTERNAL_SERVER_ERROR;
      message = error.message;
      statusCode = getStatusCodeFromErrorCode(errorCode);
    } else if (error instanceof Error) {
      message = error.message;

      if (message.includes('Invalid email') || message.includes('Invalid phone')) {
        errorCode = ErrorCode.VALIDATION_ERROR;
        statusCode = 400;
      } else if (message.includes('not found')) {
        errorCode = ErrorCode.NOT_FOUND;
        statusCode = 404;
      } else if (message.includes('already exists')) {
        errorCode = ErrorCode.CONFLICT;
        statusCode = 409;
      }
    } else {
      message = 'An unexpected error occurred';
    }

    const errorResponse = ResponseFormatter.error(errorCode, message, details);

    res.status(statusCode).json(errorResponse);

    return errorResponse;
  }

  static handleApplicationError(
    error: ApplicationError,
    res: Response,
    logger?: any,
  ): ApiErrorResponse {
    return this.handle(error, res, logger);
  }

  static validateRequired(data: Record<string, any>, ...fields: string[]): void {
    for (const field of fields) {
      if (!data[field]) {
        throw new BadRequestError(`${field.charAt(0).toUpperCase() + field.slice(1)} is required`);
      }
    }
  }

  static validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new BadRequestError('Invalid email format');
    }
  }

  static validatePassword(password: string, minLength: number = 8): void {
    if (password.length < minLength) {
      throw new BadRequestError(`Password must be at least ${minLength} characters`);
    }
  }
}
