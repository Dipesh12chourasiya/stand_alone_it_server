import { Response, NextFunction } from 'express';
import * as phoneService from '@/services/phone.service';
import { sendSuccess } from '@/utils/api-response';
import { HTTP_STATUS } from '@/constants';
import { updateDeviceInfoSchema } from '@/validators/phone.validator';
import type { AuthRequest } from '@/types';

/**
 * POST /api/v1/phone/session/:interviewId
 *
 * Create a phone session for an interview. Returns the session token
 * that is encoded into the QR code.
 */
export async function createSession(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const interviewId = req.params.interviewId as string;

    const session = await phoneService.createPhoneSession(
      req.recruiterId!,
      interviewId,
    );

    sendSuccess(res, { session }, 'Phone session created.', HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/phone/validate/:sessionToken
 *
 * Validate a session token (phone scans QR → hits this endpoint).
 */
export async function validateSession(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const sessionToken = req.params.sessionToken as string;

    const session = await phoneService.validateSessionToken(sessionToken);

    sendSuccess(res, { session }, 'Session validated.');
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/phone/session/:sessionToken
 *
 * Get full session details (used by phone to load interview info).
 */
export async function getSession(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const sessionToken = req.params.sessionToken as string;

    const session = await phoneService.getSessionByToken(sessionToken);

    sendSuccess(res, { session }, 'Session retrieved.');
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/phone/connect/:sessionToken
 *
 * Mark a phone session as connected (phone has joined).
 */
export async function connectPhone(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const sessionToken = req.params.sessionToken as string;

    const session = await phoneService.markPhoneConnected(
      sessionToken,
      req.body.deviceInfo,
    );

    sendSuccess(res, { session }, 'Phone connected.');
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/phone/device-info/:sessionToken
 *
 * Update the device info for a connected phone session.
 */
export async function updateDeviceInfo(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const sessionToken = req.params.sessionToken as string;
    const { deviceInfo } = updateDeviceInfoSchema.parse(req.body);

    const session = await phoneService.updateDeviceInfo(sessionToken, deviceInfo);

    sendSuccess(res, { session }, 'Device info updated.');
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/phone/active/:interviewId
 *
 * Get the active phone session for an interview (recruiter dashboard).
 */
export async function getActiveSession(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const interviewId = req.params.interviewId as string;

    const session = await phoneService.getActiveSession(
      interviewId,
      req.recruiterId!,
    );

    sendSuccess(res, { session }, session ? 'Active session found.' : 'No active session.');
  } catch (error) {
    next(error);
  }
}
