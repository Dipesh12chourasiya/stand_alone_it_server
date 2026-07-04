import { type Socket } from 'socket.io';
import { verifyAccessToken } from '@/utils/jwt';
import type { AuthSocket } from './types';

/**
 * Socket.IO authentication middleware.
 *
 * Reads the token from the `auth.token` handshake option (sent by the client).
 * On success the decoded recruiterId and role are attached to the socket data,
 * allowing downstream handlers to identify the caller.
 */
export function authenticateSocket(
  socket: Socket,
  next: (err?: Error) => void,
): void {
  const token = socket.handshake.auth?.token;

  if (token) {
    const payload = verifyAccessToken(token);

    if (payload) {
      const authSocket = socket as AuthSocket;
      authSocket.data.recruiterId = payload.recruiterId;
      authSocket.data.role = 'recruiter';
      return next();
    }
  }

  // No token or invalid — still allow connection but without auth context.
  // The phone client connects without a token; it authenticates via session token later.
  return next();
}
