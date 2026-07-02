import { Request, Response, NextFunction } from 'express';
import * as candidateService from '@/services/candidate.service';
import { sendSuccess } from '@/utils/api-response';
import { HTTP_STATUS } from '@/constants';
import { deviceVerificationSchema } from '@/validators/candidate.validator';

// GET /api/v1/candidate/validate/:token
export async function validateInvite(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = req.params.token as string;
    const result = await candidateService.validateInviteToken(token);
    sendSuccess(res, result, 'Invitation is valid.');
  } catch (error) {
    next(error);
  }
}

// GET /api/v1/candidate/join/:token
export async function getInterview(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = req.params.token as string;
    const result = await candidateService.getInterviewByToken(token);
    sendSuccess(res, result, 'Interview retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

// GET /api/v1/candidate/waiting-room/:token
export async function waitingRoomStatus(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = req.params.token as string;
    const result = await candidateService.getWaitingRoomStatus(token);
    sendSuccess(res, result, 'Waiting room status retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

// POST /api/v1/candidate/device-verification/:token
export async function submitDeviceVerification(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = req.params.token as string;
    const data = deviceVerificationSchema.parse(req.body);
    const result = await candidateService.submitDeviceVerification(token, data);
    sendSuccess(res, result, 'Device verification submitted successfully.', HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
}

// GET /api/v1/candidate/device-verification/:token
export async function getDeviceVerification(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = req.params.token as string;
    const result = await candidateService.getDeviceVerificationStatus(token);
    sendSuccess(res, result, 'Device verification status retrieved successfully.');
  } catch (error) {
    next(error);
  }
}
