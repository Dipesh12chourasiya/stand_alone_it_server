import crypto from 'crypto';
import { PhoneSession, type IPhoneSession } from '@/models/phone-session.model';
import { Interview } from '@/models/interview.model';
import { HTTP_STATUS } from '@/constants';
import { getIO } from '@/sockets';
import { PHONE_EVENTS } from '@/sockets/events/phone.events';

// ─── Domain Error ─────────────────────────────────────────────

export class PhoneSessionError extends Error {
  public readonly statusCode: number;
  public readonly errors: string[];

  constructor(message: string, statusCode: number, errors: string[] = []) {
    super(message);
    this.name = 'PhoneSessionError';
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

// ─── Create a phone session (recruiter starts interview) ───────

export async function createPhoneSession(
  recruiterId: string,
  interviewId: string,
) {
  // Verify the interview exists and belongs to the recruiter
  const interview = await Interview.findById(interviewId);

  if (!interview) {
    throw new PhoneSessionError('Interview not found.', HTTP_STATUS.NOT_FOUND);
  }

  if (String(interview.createdBy) !== recruiterId) {
    throw new PhoneSessionError(
      'You do not have permission to access this interview.',
      HTTP_STATUS.FORBIDDEN,
    );
  }

  // Find an existing active session for this interview
  const existing = await PhoneSession.findOne({
    interviewId,
    status: { $in: ['Pending', 'Connected'] },
    expiresAt: { $gt: new Date() },
  });

  if (existing) {
    // Reuse any still-valid session — returns the same token/QR
    return toResult(existing);
  }

  // Mark any stale sessions as expired before creating a new one
  await PhoneSession.updateMany(
    { interviewId, status: { $ne: 'Expired' } },
    { $set: { status: 'Expired' as const } },
  );

  // Generate a secure random token
  const sessionToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  const session = await PhoneSession.create({
    interviewId,
    recruiterId: recruiterId,
    sessionToken,
    expiresAt,
    status: 'Pending',
  });

  return toResult(session);
}

// ─── Validate a phone session token (phone scans QR) ───────────

export async function validateSessionToken(sessionToken: string) {
  const session = await PhoneSession.findOne({ sessionToken });

  if (!session) {
    throw new PhoneSessionError(
      'Invalid session. This QR code is not recognized.',
      HTTP_STATUS.NOT_FOUND,
    );
  }

  if (session.status === 'Expired') {
    throw new PhoneSessionError(
      'This session has expired. Please generate a new QR code.',
      HTTP_STATUS.GONE,
    );
  }

  if (session.status === 'Disconnected' || session.status === 'Connected') {
    // Allow reconnection if the session already had a phone
    return toResult(session);
  }

  if (new Date() > session.expiresAt) {
    session.status = 'Expired';
    await session.save();
    throw new PhoneSessionError(
      'This QR code has expired. Please ask the recruiter to generate a new one.',
      HTTP_STATUS.GONE,
    );
  }

  return toResult(session);
}

// ─── Mark phone as connected ───────────────────────────────────

export async function markPhoneConnected(
  sessionToken: string,
  deviceInfo?: Record<string, unknown>,
) {
  const session = await PhoneSession.findOne({ sessionToken });

  if (!session) {
    throw new PhoneSessionError('Session not found.', HTTP_STATUS.NOT_FOUND);
  }

  session.status = 'Connected';
  session.phoneConnectedAt = new Date();

  if (deviceInfo) {
    session.deviceInfo = {
      ...session.deviceInfo,
      ...deviceInfo,
    };
  }

  await session.save();

  // Emit socket event to the recruiter
  try {
    const io = getIO();
    const sessionRoom = `session:${sessionToken}`;

    io.to(sessionRoom).emit(PHONE_EVENTS.PHONE_CONNECTED, {
      status: 'Connected',
      connectedAt: session.phoneConnectedAt,
      deviceInfo: session.deviceInfo,
    });
  } catch {
    // IO not initialized yet — HTTP response still works without socket emit
  }

  return toResult(session);
}

// ─── Update device info ────────────────────────────────────────

export async function updateDeviceInfo(
  sessionToken: string,
  deviceInfo: Record<string, unknown>,
) {
  const session = await PhoneSession.findOne({ sessionToken });

  if (!session) {
    throw new PhoneSessionError('Session not found.', HTTP_STATUS.NOT_FOUND);
  }

  session.deviceInfo = {
    ...session.deviceInfo,
    ...deviceInfo,
  };

  await session.save();

  return toResult(session);
}

// ─── Get session by token ──────────────────────────────────────

export async function getSessionByToken(sessionToken: string) {
  const session = await PhoneSession.findOne({ sessionToken }).populate(
    'interviewId',
    'title candidateName date time duration',
  );

  if (!session) {
    throw new PhoneSessionError('Session not found.', HTTP_STATUS.NOT_FOUND);
  }

  return toResult(session);
}

// ─── Get active session for an interview ───────────────────────

export async function getActiveSession(interviewId: string, recruiterId: string) {
  const session = await PhoneSession.findOne({
    interviewId,
    recruiterId,
    status: { $in: ['Pending', 'Connected'] },
  });

  if (!session) {
    return null;
  }

  return toResult(session);
}

// ─── Helper ────────────────────────────────────────────────────

interface SessionResult {
  id: string;
  interviewId: string | { _id: string; title: string; candidateName: string; date: Date; time: string; duration: number };
  sessionToken: string;
  expiresAt: Date;
  status: string;
  phoneConnectedAt?: Date;
  phoneDisconnectedAt?: Date;
  deviceInfo?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

function toResult(session: IPhoneSession): SessionResult {
  const rawInterviewId = session.interviewId;

  // When populate() is used, interviewId is a populated document, not a plain ObjectId.
  // In that case return the populated shape so the API response matches SessionWithInterview.
  const interviewId =
    typeof rawInterviewId === 'object' &&
    rawInterviewId !== null &&
    '_id' in rawInterviewId
      ? {
          _id: String((rawInterviewId as { _id: unknown })._id),
          title: (rawInterviewId as { title?: string }).title ?? '',
          candidateName: (rawInterviewId as { candidateName?: string }).candidateName ?? '',
          date: (rawInterviewId as { date?: Date }).date ?? new Date(0),
          time: (rawInterviewId as { time?: string }).time ?? '',
          duration: (rawInterviewId as { duration?: number }).duration ?? 0,
        }
      : String(rawInterviewId);

  return {
    id: String(session._id),
    interviewId,
    sessionToken: session.sessionToken,
    expiresAt: session.expiresAt,
    status: session.status,
    phoneConnectedAt: session.phoneConnectedAt || undefined,
    phoneDisconnectedAt: session.phoneDisconnectedAt || undefined,
    deviceInfo: session.deviceInfo || undefined,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  };
}
