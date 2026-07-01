import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod/v4';
import { HTTP_STATUS } from '@/constants';
import type { ApiErrorResponse } from '@/types';

/**
 * Centralized error handling middleware.
 *
 * Every error — whether thrown by business logic, Zod validation, or
 * an unexpected runtime crash — flows through here and exits as a
 * consistent JSON envelope.  Stack traces are only leaked in development.
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // ─── Zod Validation Errors (v4 uses `.issues`) ──────────
  if (err instanceof ZodError) {
    const errors = err.issues.map((e) => `${e.path.join('.')}: ${e.message}`);

    const body: ApiErrorResponse = {
      success: false,
      message: 'Validation failed. Please check your input.',
      errors,
    };

    res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json(body);
    return;
  }

  // ─── Mongoose Validation Error ────────────────────────────
  if (err.name === 'ValidationError' && 'errors' in err) {
    const mongooseErr = err as unknown as {
      errors: Record<string, { message: string }>;
    };
    const errors = Object.values(mongooseErr.errors).map((e) => e.message);

    const body: ApiErrorResponse = {
      success: false,
      message: 'Validation failed. Please check your input.',
      errors,
    };

    res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json(body);
    return;
  }

  // ─── Mongoose Duplicate Key ───────────────────────────────
  if ((err as { code?: number }).code === 11000) {
    const keyValue = (err as { keyValue?: Record<string, string> }).keyValue ?? {};
    const field = Object.keys(keyValue)[0] ?? 'field';

    const body: ApiErrorResponse = {
      success: false,
      message: `A record with this ${field} already exists.`,
      errors: [`${field} is already taken`],
    };

    res.status(HTTP_STATUS.CONFLICT).json(body);
    return;
  }

  // ─── Mongoose CastError (invalid ObjectId, etc.) ─────────
  if (err.name === 'CastError') {
    const body: ApiErrorResponse = {
      success: false,
      message: 'Invalid resource identifier.',
      errors: [],
    };

    res.status(HTTP_STATUS.BAD_REQUEST).json(body);
    return;
  }

  // ─── Fallback — Unexpected Error ─────────────────────────
  const statusCode =
    (err as { statusCode?: number }).statusCode ?? HTTP_STATUS.INTERNAL_SERVER_ERROR;

  const body: ApiErrorResponse = {
    success: false,
    message:
      process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred. Please try again later.'
        : err.message,
    errors: [],
  };

  if (process.env.NODE_ENV !== 'production') {
    console.error('[ErrorHandler]', err);
  }

  res.status(statusCode).json(body);
}
