import { Interview } from '@/models/interview.model';
import { WaitingRoom } from '@/models/waiting-room.model';
import { DeviceVerification } from '@/models/device-verification.model';
import { HTTP_STATUS } from '@/constants';
import type { DeviceVerificationInput } from '@/validators/candidate.validator';

export class CandidateError extends Error {
  public readonly statusCode: number;
  public readonly errors: string[];

  constructor(message: string, statusCode: number, errors: string[] = []) {
    super(message);
    this.name = 'CandidateError';
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

// Validate invitation token and return interview summary
export async function validateInviteToken(token: string) {
  const interview = await Interview.findOne({ inviteToken: token })
    .select('title candidateName date time duration status inviteTokenExpiresAt')
    .lean();

  if (!interview) {
    throw new CandidateError('Invalid invitation link.', HTTP_STATUS.NOT_FOUND);
  }

  if (interview.status === 'Cancelled') {
    throw new CandidateError('This interview has been cancelled.', HTTP_STATUS.GONE);
  }

  if (
    interview.inviteTokenExpiresAt &&
    new Date() > interview.inviteTokenExpiresAt
  ) {
    throw new CandidateError('This invitation has expired.', HTTP_STATUS.GONE);
  }

  return {
    valid: true,
    interview: {
      id: String(interview._id),
      title: interview.title,
      candidateName: interview.candidateName,
      date: interview.date,
      time: interview.time,
      duration: interview.duration,
      status: interview.status,
    },
  };
}

// Return full interview data by token (for candidate to view meeting details)
export async function getInterviewByToken(token: string) {
  const interview = await Interview.findOne({ inviteToken: token })
    .select('-createdBy -updatedAt -__v')
    .lean();

  if (!interview) {
    throw new CandidateError('Invalid invitation link.', HTTP_STATUS.NOT_FOUND);
  }

  if (
    interview.inviteTokenExpiresAt &&
    new Date() > interview.inviteTokenExpiresAt
  ) {
    throw new CandidateError('This invitation has expired.', HTTP_STATUS.GONE);
  }

  return {
    id: String(interview._id),
    title: interview.title,
    candidateName: interview.candidateName,
    candidateEmail: interview.candidateEmail,
    meetingPlatform: interview.meetingPlatform,
    meetingLink: interview.meetingLink,
    date: interview.date,
    time: interview.time,
    duration: interview.duration,
    status: interview.status,
    notes: interview.notes,
  };
}

// Get or create waiting room entry for an interview
export async function getWaitingRoomStatus(token: string) {
  const interview = await Interview.findOne({ inviteToken: token })
    .select('_id status inviteTokenExpiresAt')
    .lean();

  if (!interview) {
    throw new CandidateError('Invalid invitation link.', HTTP_STATUS.NOT_FOUND);
  }

  if (
    interview.inviteTokenExpiresAt &&
    new Date() > interview.inviteTokenExpiresAt
  ) {
    // Mark waiting room as expired if it exists
    await WaitingRoom.updateOne(
      { interviewId: interview._id },
      { status: 'Expired' },
    );
    throw new CandidateError('This invitation has expired.', HTTP_STATUS.GONE);
  }

  if (interview.status === 'Cancelled') {
    throw new CandidateError('This interview has been cancelled.', HTTP_STATUS.GONE);
  }

  let waitingRoom = await WaitingRoom.findOne({ interviewId: interview._id });

  if (!waitingRoom) {
    waitingRoom = await WaitingRoom.create({
      interviewId: interview._id,
      status: 'Waiting',
      candidateJoinedAt: new Date(),
    });
  }

  return {
    interviewId: String(interview._id),
    status: waitingRoom.status,
    candidateJoinedAt: waitingRoom.candidateJoinedAt,
  };
}

// Submit device verification data
export async function submitDeviceVerification(
  token: string,
  data: DeviceVerificationInput,
) {
  const interview = await Interview.findOne({ inviteToken: token })
    .select('_id')
    .lean();

  if (!interview) {
    throw new CandidateError('Invalid invitation link.', HTTP_STATUS.NOT_FOUND);
  }

  const existing = await DeviceVerification.findOne({ interviewId: interview._id });
  if (existing) {
    throw new CandidateError(
      'Device verification already submitted.',
      HTTP_STATUS.CONFLICT,
    );
  }

  await DeviceVerification.create({
    interviewId: interview._id,
    ...data,
  });

  return computeVerificationResult(data);
}

// Get existing device verification result
export async function getDeviceVerificationStatus(token: string) {
  const interview = await Interview.findOne({ inviteToken: token })
    .select('_id')
    .lean();

  if (!interview) {
    throw new CandidateError('Invalid invitation link.', HTTP_STATUS.NOT_FOUND);
  }

  const verification = await DeviceVerification.findOne({
    interviewId: interview._id,
  }).lean();

  if (!verification) {
    throw new CandidateError(
      'Device verification not submitted yet.',
      HTTP_STATUS.NOT_FOUND,
    );
  }

  return computeVerificationResult({
    cameraPermission: verification.cameraPermission,
    microphonePermission: verification.microphonePermission,
    internetStatus: verification.internetStatus,
    cameraAvailable: verification.cameraAvailable,
    microphoneAvailable: verification.microphoneAvailable,
    browser: verification.browser,
    operatingSystem: verification.operatingSystem,
    screenResolution: verification.screenResolution,
    timezone: verification.timezone,
  });
}

function computeVerificationResult(data: DeviceVerificationInput) {
  const checks: Array<{ name: string; status: 'PASS' | 'FAIL' }> = [];

  const cameraOk = data.cameraPermission && data.cameraAvailable;
  const microphoneOk = data.microphonePermission && data.microphoneAvailable;
  const internetOk = data.internetStatus;

  checks.push({ name: 'Camera', status: cameraOk ? 'PASS' : 'FAIL' });
  checks.push({ name: 'Microphone', status: microphoneOk ? 'PASS' : 'FAIL' });
  checks.push({ name: 'Internet', status: internetOk ? 'PASS' : 'FAIL' });

  const allPassed = [cameraOk, microphoneOk, internetOk].every(Boolean);
  const overall = allPassed ? 'READY' : 'BLOCKED';

  return { checks, overall };
}
