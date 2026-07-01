import jwt from 'jsonwebtoken';
import { env } from '@/config/env';
import type { JwtPayload } from '@/types';

/**
 * Create a signed access token.
 *
 * The payload only carries `recruiterId` and `role` — never expose
 * user data inside the token itself.
 */
export function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as string | number,
  } as jwt.SignOptions);
}

/**
 * Verify and decode an access token.
 *
 * Returns `null` when the token is invalid or expired (caller decides
 * the HTTP response) instead of throwing.
 */
export function verifyAccessToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
    return decoded;
  } catch {
    return null;
  }
}
