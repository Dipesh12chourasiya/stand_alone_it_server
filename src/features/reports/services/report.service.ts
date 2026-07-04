import { Report, type IReport } from '../models/report.model';
import { Interview } from '@/models/interview.model';
import { DeviceVerification } from '@/models/device-verification.model';
import { Timeline } from '@/features/timeline/models/timeline.model';
import { PhoneSession } from '@/models/phone-session.model';
import * as timelineService from '@/features/timeline/services/timeline.service';
import type { ReportResult, ReportListData } from '../types';
import type { CreateReportInput, ReportQuery } from '../validators/report.validator';

// ─── Domain Error ───────────────────────────────────────────────

export class ReportError extends Error {
  public readonly statusCode: number;
  public readonly errors: string[];

  constructor(message: string, statusCode: number, errors: string[] = []) {
    super(message);
    this.name = 'ReportError';
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

// ─── Helpers ────────────────────────────────────────────────────

function toResult(doc: IReport): ReportResult {
  return {
    id: String(doc._id),
    interviewId: String(doc.interviewId),
    recruiterId: String(doc.recruiterId),
    interview: {
      id: String(doc.interviewId),
      title: doc.interview.title,
      candidateName: doc.interview.candidateName,
      candidateEmail: doc.interview.candidateEmail,
      candidatePhone: doc.interview.candidatePhone || undefined,
      meetingPlatform: doc.interview.meetingPlatform,
      meetingLink: doc.interview.meetingLink,
      date: doc.interview.date.toISOString(),
      time: doc.interview.time,
      duration: doc.interview.duration,
      status: doc.interview.status,
    },
    recruiter: doc.recruiter
      ? {
          id: String(doc.recruiterId),
          name: doc.recruiter.name,
          email: doc.recruiter.email,
          company: doc.recruiter.company,
        }
      : undefined,
    duration: doc.duration,
    status: doc.status,
    timelineSummary: doc.timelineSummary?.map((e) => ({
      eventType: e.eventType,
      severity: e.severity,
      message: e.message,
      createdAt: e.createdAt.toISOString(),
    })),
    connectionHistory: doc.connectionHistory?.map((c) => ({
      role: c.role,
      connectedAt: c.connectedAt.toISOString(),
      disconnectedAt: c.disconnectedAt?.toISOString(),
      duration: c.duration,
    })),
    deviceVerification: doc.deviceVerification
      ? {
          overall: doc.deviceVerification.overall,
          checks: doc.deviceVerification.checks,
          browser: doc.deviceVerification.browser,
          operatingSystem: doc.deviceVerification.operatingSystem,
          screenResolution: doc.deviceVerification.screenResolution,
          submittedAt: doc.deviceVerification.submittedAt?.toISOString(),
        }
      : undefined,
    notes: doc.notes,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

function buildSort(sort: string): Record<string, 1 | -1> {
  return sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };
}

// ─── Generate Report ────────────────────────────────────────────
// Assembles data from multiple collections (Interview, Recruiter,
// Timeline, DeviceVerification, PhoneSession) and saves a report.

export async function generateReport(
  recruiterId: string,
  input: CreateReportInput,
): Promise<ReportResult> {
  // Fetch interview with ownership check
  const interview = await Interview.findById(input.interviewId);
  if (!interview) {
    throw new ReportError('Interview not found.', 404);
  }
  if (String(interview.createdBy) !== recruiterId) {
    throw new ReportError('You do not have permission to generate a report for this interview.', 403);
  }

  // Check for existing report (one report per interview)
  const existing = await Report.findOne({ interviewId: input.interviewId });
  if (existing) {
    throw new ReportError('A report already exists for this interview.', 409);
  }

  // Gather data from related collections in parallel
  const [allTimelineEvents, deviceVerification, phoneSessions] = await Promise.all([
    timelineService.getAllEvents(String(input.interviewId)),
    DeviceVerification.findOne({ interviewId: input.interviewId }).lean(),
    PhoneSession.find({ interviewId: input.interviewId }).lean(),
  ]);

  // ─── Build timeline summary ──────────────────────────────────
  const timelineSummary = allTimelineEvents.map((e) => ({
    eventType: e.eventType,
    severity: e.severity,
    message: e.message,
    createdAt: new Date(e.createdAt),
  }));

  // ─── Build connection history from phone sessions ────────────
  const connectionHistory = phoneSessions.map((ps) => ({
    role: 'phone',
    connectedAt: ps.phoneConnectedAt || ps.createdAt,
    disconnectedAt: ps.phoneDisconnectedAt || undefined,
    duration: ps.phoneConnectedAt && ps.phoneDisconnectedAt
      ? Math.round((ps.phoneDisconnectedAt.getTime() - ps.phoneConnectedAt.getTime()) / 60000)
      : 0,
  }));

  // ─── Build device verification summary ──────────────────────
  let deviceVerificationSummary: IReport['deviceVerification'] | undefined;

  if (deviceVerification) {
    // Compute pass/fail for each check
    const checks = [
      { name: 'Camera', status: deviceVerification.cameraPermission && deviceVerification.cameraAvailable ? 'pass' as const : 'fail' as const },
      { name: 'Microphone', status: deviceVerification.microphonePermission && deviceVerification.microphoneAvailable ? 'pass' as const : 'fail' as const },
      { name: 'Internet', status: deviceVerification.internetStatus ? 'pass' as const : 'fail' as const },
    ];

    deviceVerificationSummary = {
      overall: checks.every((c) => c.status === 'pass') ? 'pass' : 'fail',
      checks,
      browser: deviceVerification.browser,
      operatingSystem: deviceVerification.operatingSystem,
      screenResolution: deviceVerification.screenResolution,
      submittedAt: deviceVerification.createdAt,
    };
  }

  // ─── Save report ─────────────────────────────────────────────
  const doc = await Report.create({
    interviewId: input.interviewId,
    recruiterId: recruiterId,
    interview: {
      title: interview.title,
      candidateName: interview.candidateName,
      candidateEmail: interview.candidateEmail,
      candidatePhone: interview.candidatePhone || '',
      meetingPlatform: interview.meetingPlatform,
      meetingLink: interview.meetingLink,
      date: interview.date,
      time: interview.time,
      duration: interview.duration,
      status: interview.status,
    },
    duration: interview.duration,
    status: interview.status,
    timelineSummary,
    connectionHistory,
    deviceVerification: deviceVerificationSummary,
    notes: input.notes || '',
    metadata: input.metadata || {},
  });

  return toResult(doc);
}

// ─── List Reports (paginated, searchable) ───────────────────────

export async function listReports(
  recruiterId: string,
  query: ReportQuery,
): Promise<ReportListData> {
  const { page, limit, search, status, sort } = query;

  const filter: Record<string, unknown> = { recruiterId };

  if (status) {
    filter.status = status;
  }

  // Search across candidate name and interview title
  if (search) {
    const searchRegex = { $regex: search, $options: 'i' };
    filter.$or = [
      { 'interview.candidateName': searchRegex },
      { 'interview.title': searchRegex },
      { 'interview.candidateEmail': searchRegex },
    ];
  }

  const skip = (page - 1) * limit;
  const sortObj = buildSort(sort);

  const [docs, total] = await Promise.all([
    Report.find(filter).sort(sortObj).skip(skip).limit(limit).lean(),
    Report.countDocuments(filter),
  ]);

  return {
    reports: docs.map((doc) => toResult(doc as unknown as IReport)),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ─── Get Report by ID ───────────────────────────────────────────

export async function getReportById(
  recruiterId: string,
  reportId: string,
): Promise<ReportResult> {
  const report = await Report.findById(reportId);
  if (!report) {
    throw new ReportError('Report not found.', 404);
  }
  if (String(report.recruiterId) !== recruiterId) {
    throw new ReportError('You do not have permission to access this report.', 403);
  }

  return toResult(report);
}

// ─── Delete Report ─────────────────────────────────────────────

export async function deleteReport(
  recruiterId: string,
  reportId: string,
): Promise<void> {
  const report = await Report.findById(reportId);
  if (!report) {
    throw new ReportError('Report not found.', 404);
  }
  if (String(report.recruiterId) !== recruiterId) {
    throw new ReportError('You do not have permission to delete this report.', 403);
  }

  await report.deleteOne();
}

// ─── Get raw report document (for PDF generation) ──────────────

export async function getReportDocument(reportId: string): Promise<IReport | null> {
  return Report.findById(reportId).lean();
}
