import { Response, NextFunction } from 'express';
import * as interviewService from '@/services/interview.service';
import { sendSuccess } from '@/utils/api-response';
import { HTTP_STATUS } from '@/constants';
import { interviewQuerySchema, objectIdSchema } from '@/validators/interview.validator';
import type { AuthRequest } from '@/types';

/**
 * POST /api/v1/interviews
 *
 * Create a new interview for the authenticated recruiter.
 */
export async function create(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const interview = await interviewService.createInterview(
      req.recruiterId!,
      req.body,
    );

    sendSuccess(res, { interview }, 'Interview created successfully.', HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/interviews
 *
 * List the authenticated recruiter's interviews with pagination, search, filter, and sort.
 */
export async function list(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // Parse and validate query params
    const query = interviewQuerySchema.parse(req.query);

    const result = await interviewService.listInterviews(
      req.recruiterId!,
      query,
    );

    sendSuccess(res, result, 'Interviews retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/interviews/:id
 *
 * Get a single interview by its ID.
 */
export async function getById(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const interviewId = objectIdSchema.parse(req.params.id);

    const interview = await interviewService.getInterviewById(
      req.recruiterId!,
      interviewId,
    );

    sendSuccess(res, { interview }, 'Interview retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/interviews/:id
 *
 * Update an existing interview.
 */
export async function update(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const interviewId = objectIdSchema.parse(req.params.id);

    const interview = await interviewService.updateInterview(
      req.recruiterId!,
      interviewId,
      req.body,
    );

    sendSuccess(res, { interview }, 'Interview updated successfully.');
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/v1/interviews/:id
 *
 * Delete an interview.
 */
export async function remove(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const interviewId = objectIdSchema.parse(req.params.id);

    await interviewService.deleteInterview(req.recruiterId!, interviewId);

    sendSuccess(res, null, 'Interview deleted successfully.');
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/interviews/:id/generate-invite
 *
 * Generate a unique invitation token for an interview.
 */
export async function generateInvite(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const interviewId = objectIdSchema.parse(req.params.id);

    const result = await interviewService.generateInviteToken(
      req.recruiterId!,
      interviewId,
    );

    sendSuccess(res, result, 'Invitation token generated successfully.');
  } catch (error) {
    next(error);
  }
}
