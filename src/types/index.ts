import { Request } from 'express';

// ─── JWT ────────────────────────────────────────────────────

export interface JwtPayload {
  recruiterId: string;
  role: string;
}

// ─── Auth Request (extends Express Request) ─────────────────

export interface AuthRequest extends Request {
  recruiterId?: string;
  recruiterRole?: string;
}

// ─── API Response Shape ─────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T | null;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors: string[];
}
