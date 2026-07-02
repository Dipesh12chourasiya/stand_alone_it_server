import {
  Interview,
  type IInterview,
  type MeetingPlatform,
  type InterviewStatus,
} from '@/models/interview.model';
import { HTTP_STATUS } from '@/constants';
import type { InterviewResult, PaginatedResult } from '@/interfaces';
import type {
  CreateInterviewInput,
  UpdateInterviewInput,
  InterviewQuery,
} from '@/validators/interview.validator';
import crypto from 'crypto';

// ─── Domain Error ─────────────────────────────────────────────

export class InterviewError extends Error {
  public readonly statusCode: number;
  public readonly errors: string[];

  constructor(message: string, statusCode: number, errors: string[] = []) {
    super(message);
    this.name = 'InterviewError';
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

// ─── Helpers ──────────────────────────────────────────────────

function toResult(interview: IInterview): InterviewResult {
  return {
    id: String(interview._id),
    title: interview.title,
    candidateName: interview.candidateName,
    candidateEmail: interview.candidateEmail,
    candidatePhone: interview.candidatePhone || undefined,
    meetingPlatform: interview.meetingPlatform,
    meetingLink: interview.meetingLink,
    date: interview.date,
    time: interview.time,
    duration: interview.duration,
    status: interview.status,
    notes: interview.notes || undefined,
    createdBy: String(interview.createdBy),
    inviteToken: interview.inviteToken || undefined,
    inviteTokenExpiresAt: interview.inviteTokenExpiresAt || undefined,
    createdAt: interview.createdAt,
    updatedAt: interview.updatedAt,
  };
}

// ─── Ownership guard ──────────────────────────────────────────

async function findOwnedInterview(
  recruiterId: string,
  interviewId: string,
): Promise<IInterview> {
  const interview = await Interview.findById(interviewId);

  if (!interview) {
    throw new InterviewError(
      'Interview not found.',
      HTTP_STATUS.NOT_FOUND,
    );
  }

  if (String(interview.createdBy) !== recruiterId) {
    throw new InterviewError(
      'You do not have permission to access this interview.',
      HTTP_STATUS.FORBIDDEN,
    );
  }

  return interview;
}

// ─── Build query sort object ──────────────────────────────────

function buildSort(sort: string): Record<string, 1 | -1> {
  switch (sort) {
    case 'oldest':
      return { createdAt: 1 };
    case 'date':
      return { date: -1, time: -1 };
    case 'newest':
    default:
      return { createdAt: -1 };
  }
}

// ─── Create ───────────────────────────────────────────────────

export async function createInterview(
  recruiterId: string,
  input: CreateInterviewInput,
): Promise<InterviewResult> {
  const interview = await Interview.create({
    title: input.title,
    candidateName: input.candidateName,
    candidateEmail: input.candidateEmail,
    candidatePhone: input.candidatePhone,
    meetingPlatform: input.meetingPlatform as MeetingPlatform,
    meetingLink: input.meetingLink,
    date: new Date(input.date),
    time: input.time,
    duration: input.duration,
    notes: input.notes,
    createdBy: recruiterId,
  });

  return toResult(interview);
}

// ─── List (paginated, searchable, filterable, sortable) ──────

export async function listInterviews(
  recruiterId: string,
  query: InterviewQuery,
): Promise<PaginatedResult<InterviewResult>> {
  const { page, limit, search, status, platform, dateFrom, dateTo, sort } = query;

  // Build the filter — always scoped to the recruiter's interviews
  const filter: Record<string, unknown> = { createdBy: recruiterId };

  // Status filter
  if (status) {
    filter.status = status;
  }

  // Platform filter
  if (platform) {
    filter.meetingPlatform = platform;
  }

  // Date range filter
  if (dateFrom || dateTo) {
    const dateFilter: Record<string, Date> = {};
    if (dateFrom) dateFilter.$gte = new Date(dateFrom);
    if (dateTo) dateFilter.$lte = new Date(dateTo);
    filter.date = dateFilter;
  }

  // Search across title, candidate name, and candidate email
  if (search) {
    const searchRegex = { $regex: search, $options: 'i' };
    filter.$or = [
      { title: searchRegex },
      { candidateName: searchRegex },
      { candidateEmail: searchRegex },
    ];
  }

  const skip = (page - 1) * limit;
  const sortObj = buildSort(sort);

  const [interviews, total] = await Promise.all([
    Interview.find(filter).sort(sortObj).skip(skip).limit(limit).lean(),
    Interview.countDocuments(filter),
  ]);

  return {
    interviews: interviews.map((doc) =>
      toResult(doc as unknown as IInterview),
    ),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ─── Get by ID ────────────────────────────────────────────────

export async function getInterviewById(
  recruiterId: string,
  interviewId: string,
): Promise<InterviewResult> {
  const interview = await findOwnedInterview(recruiterId, interviewId);
  return toResult(interview);
}

// ─── Update ───────────────────────────────────────────────────

export async function updateInterview(
  recruiterId: string,
  interviewId: string,
  input: UpdateInterviewInput,
): Promise<InterviewResult> {
  const interview = await findOwnedInterview(recruiterId, interviewId);

  // Build update payload — only include provided fields
  const updateData: Record<string, unknown> = { ...input };

  // Convert date string to Date object if provided
  if (input.date) {
    updateData.date = new Date(input.date);
  }

  Object.assign(interview, updateData);
  await interview.save();

  return toResult(interview);
}

// ─── Delete ───────────────────────────────────────────────────

export async function deleteInterview(
  recruiterId: string,
  interviewId: string,
): Promise<void> {
  const interview = await findOwnedInterview(recruiterId, interviewId);
  await interview.deleteOne();
}

// Generate a unique invitation token with expiry
export async function generateInviteToken(
  recruiterId: string,
  interviewId: string,
): Promise<{ inviteToken: string; inviteTokenExpiresAt: Date }> {
  const interview = await findOwnedInterview(recruiterId, interviewId);

  const inviteToken = crypto.randomBytes(32).toString('hex');
  const inviteTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  interview.inviteToken = inviteToken;
  interview.inviteTokenExpiresAt = inviteTokenExpiresAt;
  await interview.save();

  return { inviteToken, inviteTokenExpiresAt };
}
