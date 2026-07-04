import { Response, NextFunction } from 'express';
import * as reportService from '../services/report.service';
import { sendSuccess } from '@/utils/api-response';
import { HTTP_STATUS } from '@/constants';
import {
  createReportSchema,
  updateReportSchema,
  reportQuerySchema,
  objectIdSchema,
} from '../validators/report.validator';
import { generateReportHtml, getPdfFilename } from '../utils/pdf-generator';
import { Report } from '../models/report.model';
import type { AuthRequest } from '@/types';

/**
 * POST /api/v1/reports
 *
 * Generate a new report for an interview session.
 * Assembles data from Interview, Timeline, DeviceVerification, and PhoneSession collections.
 */
export async function create(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = createReportSchema.parse(req.body);
    const report = await reportService.generateReport(req.recruiterId!, input);

    sendSuccess(res, { report }, 'Report generated successfully.', HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/reports
 *
 * List reports for the authenticated recruiter with pagination, search, and filter.
 */
export async function list(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = reportQuerySchema.parse(req.query);
    const result = await reportService.listReports(req.recruiterId!, query);

    sendSuccess(res, result, 'Reports retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/reports/:id
 *
 * Get a single report by ID.
 */
export async function getById(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const reportId = objectIdSchema.parse(req.params.id);
    const report = await reportService.getReportById(req.recruiterId!, reportId);

    sendSuccess(res, { report }, 'Report retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/v1/reports/:id
 *
 * Delete a report.
 */
export async function remove(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const reportId = objectIdSchema.parse(req.params.id);
    await reportService.deleteReport(req.recruiterId!, reportId);

    sendSuccess(res, null, 'Report deleted successfully.');
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/reports/:id/download
 *
 * Download a report as a PDF.
 * Uses the HTML-to-PDF rendering approach — the returned HTML can be
 * opened in a browser or converted by a headless browser tool.
 *
 * When puppeteer is integrated, replace with:
 *   res.contentType('application/pdf');
 *   res.send(pdfBuffer);
 */
export async function download(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const reportId = objectIdSchema.parse(req.params.id);

    // Fetch the report (ownership check)
    const report = await reportService.getReportById(req.recruiterId!, reportId);

    // Get the full document for PDF generation
    const reportDoc = await Report.findById(reportId).lean();
    if (!reportDoc) {
      res.status(404).json({ success: false, message: 'Report not found.', data: null });
      return;
    }

    const html = generateReportHtml(reportDoc);
    const filename = getPdfFilename(reportDoc);

    // Serve as HTML that the browser can save as PDF
    // Replace with proper PDF rendering when puppeteer is integrated.
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.send(html);
  } catch (error) {
    next(error);
  }
}
