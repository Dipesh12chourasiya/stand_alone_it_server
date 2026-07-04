import { Response, NextFunction } from 'express';
import * as timelineService from '../services/timeline.service';
import { sendSuccess } from '@/utils/api-response';
import { HTTP_STATUS } from '@/constants';
import { createTimelineSchema, timelineQuerySchema, objectIdSchema } from '../validators/timeline.validator';
import type { AuthRequest } from '@/types';

/**
 * POST /api/v1/timeline
 *
 * Create a new timeline event.
 * Designed to be called by any service (interview, phone, webrtc, AI, etc.)
 * without requiring authentication from the caller — the sessionId is the
 * interview identifier and the caller provides all event data.
 */
export async function create(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = createTimelineSchema.parse(req.body);
    const event = await timelineService.createEvent(input);

    sendSuccess(res, { event }, 'Timeline event created.', HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/timeline/:sessionId
 *
 * List timeline events for a given session, with optional filtering.
 */
export async function list(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const sessionId = objectIdSchema.parse(req.params.sessionId);
    const query = timelineQuerySchema.parse(req.query);

    const result = await timelineService.listEvents(sessionId, query);

    sendSuccess(res, result, 'Timeline events retrieved.');
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/timeline/:sessionId/export
 *
 * Export all timeline events for a session as a JSON array.
 * Intended for report generation or external download.
 */
export async function exportEvents(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const sessionId = objectIdSchema.parse(req.params.sessionId);
    const events = await timelineService.getAllEvents(sessionId);

    sendSuccess(res, { events }, 'Timeline events exported.');
  } catch (error) {
    next(error);
  }
}
