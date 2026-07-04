import { z } from 'zod/v4';

// ─── Create Report ──────────────────────────────────────────────

export const createReportSchema = z.object({
  interviewId: z
    .string()
    .regex(/^[a-fA-F0-9]{24}$/, 'Interview ID must be a valid MongoDB ObjectId'),

  notes: z
    .string()
    .max(5000, 'Notes must not exceed 5000 characters')
    .optional()
    .default(''),

  metadata: z
    .record(z.string(), z.unknown())
    .optional()
    .default({}),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;

// ─── Update Report (notes only for now) ─────────────────────────

export const updateReportSchema = z.object({
  notes: z
    .string()
    .max(5000, 'Notes must not exceed 5000 characters')
    .optional(),
});

export type UpdateReportInput = z.infer<typeof updateReportSchema>;

// ─── Query Params ───────────────────────────────────────────────

export const reportQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  status: z.string().optional(),
  sort: z.enum(['newest', 'oldest'], { message: 'Sort must be newest or oldest' }).default('newest'),
});

export type ReportQuery = z.infer<typeof reportQuerySchema>;

// ─── ObjectId param ─────────────────────────────────────────────

export const objectIdSchema = z
  .string()
  .regex(/^[a-fA-F0-9]{24}$/, 'Invalid resource identifier');
