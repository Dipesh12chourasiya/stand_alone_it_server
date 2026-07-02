import { Response, NextFunction } from 'express';
import * as dashboardService from '@/services/dashboard.service';
import { sendSuccess } from '@/utils/api-response';
import type { AuthRequest } from '@/types';

export async function stats(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await dashboardService.getDashboardStats(req.recruiterId!);
    sendSuccess(res, result, 'Dashboard stats retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

export async function weekly(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await dashboardService.getWeeklyAnalytics(req.recruiterId!);
    sendSuccess(res, result, 'Weekly analytics retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

export async function monthly(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await dashboardService.getMonthlyAnalytics(req.recruiterId!);
    sendSuccess(res, result, 'Monthly analytics retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

export async function recent(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const limit = Number(req.query.limit) || 5;
    const result = await dashboardService.getRecentInterviews(req.recruiterId!, limit);
    sendSuccess(res, { interviews: result }, 'Recent interviews retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

export async function statusCounts(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await dashboardService.getStatusCounts(req.recruiterId!);
    sendSuccess(res, result, 'Status counts retrieved successfully.');
  } catch (error) {
    next(error);
  }
}
