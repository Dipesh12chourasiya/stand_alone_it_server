import { Response, NextFunction } from 'express';
import { verifyAccessToken } from '@/utils/jwt';
import { sendError } from '@/utils/api-response';
import { HTTP_STATUS } from '@/constants';
import type { AuthRequest } from '@/types';

/**
 * Express middleware that guards routes behind a valid JWT.
 *
 * Reads the token from the `Authorization` header (Bearer scheme).
 * On success it attaches `recruiterId` and `recruiterRole` to the
 * request object so downstream handlers can identify the caller.
 */
export function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(
      res,
      'Authentication required. Please provide a valid access token.',
      HTTP_STATUS.UNAUTHORIZED,
    );
    return;
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    sendError(
      res,
      'Authentication required. Please provide a valid access token.',
      HTTP_STATUS.UNAUTHORIZED,
    );
    return;
  }

  const payload = verifyAccessToken(token);

  if (!payload) {
    sendError(
      res,
      'Your session has expired or the token is invalid. Please log in again.',
      HTTP_STATUS.UNAUTHORIZED,
    );
    return;
  }

  // Attach auth context to the request
  req.recruiterId = payload.recruiterId;
  req.recruiterRole = payload.role;

  next();
}
