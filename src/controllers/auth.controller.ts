import { Response, NextFunction } from 'express';
import * as authService from '@/services/auth.service';
import { sendSuccess } from '@/utils/api-response';
import { HTTP_STATUS } from '@/constants';
import type { AuthRequest } from '@/types';

/**
 * POST /api/v1/auth/register
 *
 * Create a new recruiter account and return a JWT.
 */
export async function register(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await authService.register(req.body);

    sendSuccess(
      res,
      {
        recruiter: result.recruiter,
        accessToken: result.accessToken,
      },
      'Account created successfully.',
      HTTP_STATUS.CREATED,
    );
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/auth/login
 *
 * Authenticate a recruiter and return a JWT.
 */
export async function login(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await authService.login(req.body);

    sendSuccess(
      res,
      {
        recruiter: result.recruiter,
        accessToken: result.accessToken,
      },
      'Login successful.',
    );
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/auth/me
 *
 * Return the authenticated recruiter's profile.
 */
export async function me(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const profile = await authService.getProfile(req.recruiterId!);

    sendSuccess(res, { recruiter: profile }, 'Profile retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/auth/logout
 *
 * Logout is stateless (JWT).  The client discards the token.
 * We respond with success so consumers have a consistent interface.
 */
export async function logout(
  _req: AuthRequest,
  res: Response,
): Promise<void> {
  sendSuccess(res, null, 'Logged out successfully.');
}
