import { type Socket } from 'socket.io';

/**
 * Extended socket with typed data carried across the connection lifetime.
 *
 * `interviewId` — set when the client joins an interview room
 * `role` — 'recruiter', 'candidate', or 'phone'
 * `recruiterId` — MongoDB ObjectId of the recruiter (set at auth time)
 * `sessionToken` — phone session token (set when phone joins)
 * `deviceInfo` — phone device metadata
 */
export interface SocketData {
  interviewId?: string;
  role?: 'recruiter' | 'candidate' | 'phone';
  recruiterId?: string;
  sessionToken?: string;
  deviceInfo?: Record<string, unknown>;
}

export type AuthSocket = Socket & { data: SocketData };

/**
 * Valid socket roles for authentication and routing.
 */
export const VALID_ROLES = ['recruiter', 'candidate', 'phone'] as const;
