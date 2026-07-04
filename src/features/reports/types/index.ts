// ─── Interview Information ──────────────────────────────────────

export interface InterviewInfo {
  id: string;
  title: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  meetingPlatform: string;
  meetingLink: string;
  date: string;
  time: string;
  duration: number;
  status: string;
}

// ─── Recruiter Information ──────────────────────────────────────

export interface RecruiterInfo {
  id: string;
  name: string;
  email: string;
  company: string;
}

// ─── Connection Record ──────────────────────────────────────────

export interface ConnectionRecord {
  role: string;
  connectedAt: string;
  disconnectedAt?: string;
  duration?: number;
}

// ─── Device Verification Summary ────────────────────────────────

export interface DeviceCheckItem {
  name: string;
  status: 'pass' | 'fail';
}

export interface DeviceVerificationSummary {
  overall: 'pass' | 'fail';
  checks: DeviceCheckItem[];
  browser?: string;
  operatingSystem?: string;
  screenResolution?: string;
  submittedAt?: string;
}

// ─── Timeline Summary ───────────────────────────────────────────

export interface TimelineSummaryEntry {
  eventType: string;
  severity: string;
  message: string;
  createdAt: string;
}

// ─── Report ─────────────────────────────────────────────────────

export interface ReportResult {
  id: string;
  interviewId: string;
  recruiterId: string;

  interview: InterviewInfo;
  recruiter?: RecruiterInfo;

  duration: number; // Interview duration in minutes
  status: string;

  timelineSummary?: TimelineSummaryEntry[];
  connectionHistory?: ConnectionRecord[];
  deviceVerification?: DeviceVerificationSummary;

  notes: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Paginated reports ──────────────────────────────────────────

export interface ReportListData {
  reports: ReportResult[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ─── Query params ───────────────────────────────────────────────

export interface ReportQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sort?: 'newest' | 'oldest';
}
