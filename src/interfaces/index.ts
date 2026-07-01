// ─── Auth Return Types ────────────────────────────────────────

export interface AuthResult {
  recruiter: {
    id: string;
    name: string;
    email: string;
    company: string;
    role: string;
    avatar?: string;
    createdAt: Date;
  };
  accessToken: string;
}

export interface RecruiterProfile {
  id: string;
  name: string;
  email: string;
  company: string;
  role: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Interview Return Types ───────────────────────────────────

export interface InterviewResult {
  id: string;
  title: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  meetingPlatform: string;
  meetingLink: string;
  date: Date;
  time: string;
  duration: number;
  status: string;
  notes?: string;
  createdBy: string;
  inviteToken: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedResult<T> {
  interviews: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
