// ─── HTTP Status Codes ──────────────────────────────────────

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// ─── Token Configuration ────────────────────────────────────

export const TOKEN_CONFIG = {
  ACCESS_TOKEN_EXPIRES_IN: '15m',
  REFRESH_TOKEN_EXPIRES_IN: '7d',
} as const;

// ─── Roles ──────────────────────────────────────────────────

export const ROLES = {
  RECRUITER: 'recruiter',
} as const;

// ─── Mongoose Defaults ──────────────────────────────────────

export const DEFAULT_AVATAR =
  'https://ui-avatars.com/api/?background=random&name=Recruiter&size=128';
