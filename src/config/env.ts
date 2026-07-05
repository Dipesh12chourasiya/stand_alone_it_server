import dotenv from 'dotenv';
import path from 'path';

// Load .env from the project root (server/)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Validated environment variables.
 *
 * We validate required variables at startup so the server fails fast
 * instead of running with undefined values.
 */
export const env = {
  PORT: Number(process.env.PORT) || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',

  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/interview_guard_ai',

  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'fallback_dev_secret',

  /**
   * Access-token lifetime as a human-readable string passed to `jsonwebtoken`.
   * Examples: "15m" (15 minutes), "1h" (1 hour), "7d" (7 days).
   */
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',

  CLIENT_URL: process.env.CLIENT_URL || 'https://stand-alone-it-client-lac.vercel.app',
} as const;
