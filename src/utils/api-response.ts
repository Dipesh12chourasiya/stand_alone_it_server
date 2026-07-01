import { Response } from 'express';
import { HTTP_STATUS } from '@/constants';
import type { ApiResponse, ApiErrorResponse } from '@/types';

/**
 * Send a success response.
 *
 * Always uses the same envelope shape so the frontend gets consistent payloads.
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode: number = HTTP_STATUS.OK,
): void {
  const body: ApiResponse<T> = {
    success: true,
    message,
    data,
  };

  res.status(statusCode).json(body);
}

/**
 * Send an error response.
 *
 * `errors` is an optional array of human-readable strings (e.g. validation
 * messages).  The top-level `message` should be a short summary.
 */
export function sendError(
  res: Response,
  message: string,
  statusCode: number = HTTP_STATUS.BAD_REQUEST,
  errors: string[] = [],
): void {
  const body: ApiErrorResponse = {
    success: false,
    message,
    errors,
  };

  res.status(statusCode).json(body);
}
