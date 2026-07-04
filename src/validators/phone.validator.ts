import { z } from 'zod/v4';

// ─── Create phone session ──────────────────────────────────────

export const createPhoneSessionSchema = z.object({
  interviewId: z.string(),
});

// ─── Validate session token ────────────────────────────────────

export const sessionTokenSchema = z.object({
  sessionToken: z.string().min(1, 'Session token is required'),
});

// ─── Update device info ────────────────────────────────────────

export const updateDeviceInfoSchema = z.object({
  deviceInfo: z.object({
    browser: z.string().optional(),
    os: z.string().optional(),
    camera: z.string().optional(),
    batteryLevel: z.number().min(0).max(100).optional(),
    internetType: z.string().optional(),
  }),
});
