import { z } from 'zod/v4';

// ─── Register ───────────────────────────────────────────────

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must not exceed 100 characters'),

    email: z
      .string()
      .trim()
      .email('Please provide a valid email address')
      .transform((v) => v.toLowerCase()),

    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password must not exceed 128 characters'),

    company: z
      .string()
      .trim()
      .min(1, 'Company name is required')
      .max(200, 'Company name must not exceed 200 characters'),

    avatar: z.string().trim().optional(),
  })
  .required({
    name: true,
    email: true,
    password: true,
    company: true,
  });

export type RegisterInput = z.infer<typeof registerSchema>;

// ─── Login ──────────────────────────────────────────────────

export const loginSchema = z
  .object({
    email: z
      .string()
      .trim()
      .email('Please provide a valid email address')
      .transform((v) => v.toLowerCase()),

    password: z.string().min(1, 'Password is required'),
  })
  .required({
    email: true,
    password: true,
  });

export type LoginInput = z.infer<typeof loginSchema>;
