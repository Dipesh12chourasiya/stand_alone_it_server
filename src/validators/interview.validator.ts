import { z } from 'zod/v4';

// ─── Enum values (defined inline for Zod v4 compatibility) ───

const PLATFORM_VALUES = ['Google Meet', 'Microsoft Teams', 'Zoom', 'Other'] as const;
const STATUS_VALUES = ['Scheduled', 'Completed', 'Cancelled'] as const;
const SORT_VALUES = ['newest', 'oldest', 'date'] as const;

// ─── Create ──────────────────────────────────────────────────

export const createInterviewSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must not exceed 200 characters'),

  candidateName: z
    .string()
    .min(1, 'Candidate name is required')
    .max(100, 'Candidate name must not exceed 100 characters'),

  candidateEmail: z
    .string()
    .email('Candidate email must be a valid email address'),

  candidatePhone: z
    .string()
    .optional(),

  meetingPlatform: z
    .enum([...PLATFORM_VALUES] as [string, ...string[]], {
      message: 'Platform must be one of: Google Meet, Microsoft Teams, Zoom, Other',
    }),

  meetingLink: z
    .string()
    .url('Meeting link must be a valid URL'),

  date: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), 'Date must be a valid date'),

  time: z
    .string()
    .min(1, 'Time is required'),

  duration: z
    .number()
    .int('Duration must be a whole number')
    .min(1, 'Duration must be at least 1 minute')
    .max(480, 'Duration must not exceed 480 minutes (8 hours)'),

  notes: z
    .string()
    .max(2000, 'Notes must not exceed 2000 characters')
    .optional(),
});

// ─── Update (all fields optional) ────────────────────────────

export const updateInterviewSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must not exceed 200 characters')
    .optional(),

  candidateName: z
    .string()
    .min(1, 'Candidate name is required')
    .max(100, 'Candidate name must not exceed 100 characters')
    .optional(),

  candidateEmail: z
    .string()
    .email('Candidate email must be a valid email address')
    .optional(),

  candidatePhone: z
    .string()
    .optional(),

  meetingPlatform: z
    .enum([...PLATFORM_VALUES] as [string, ...string[]], {
      message: 'Platform must be one of: Google Meet, Microsoft Teams, Zoom, Other',
    })
    .optional(),

  meetingLink: z
    .string()
    .url('Meeting link must be a valid URL')
    .optional(),

  date: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), 'Date must be a valid date')
    .optional(),

  time: z
    .string()
    .min(1, 'Time is required')
    .optional(),

  duration: z
    .number()
    .int('Duration must be a whole number')
    .min(1, 'Duration must be at least 1 minute')
    .max(480, 'Duration must not exceed 480 minutes (8 hours)')
    .optional(),

  status: z
    .enum([...STATUS_VALUES] as [string, ...string[]], {
      message: 'Status must be one of: Scheduled, Completed, Cancelled',
    })
    .optional(),

  notes: z
    .string()
    .max(2000, 'Notes must not exceed 2000 characters')
    .optional(),
});

// ─── Query params for list endpoint ──────────────────────────

export const interviewQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  status: z
    .enum([...STATUS_VALUES] as [string, ...string[]], {
      message: 'Status must be one of: Scheduled, Completed, Cancelled',
    })
    .optional(),
  platform: z
    .enum([...PLATFORM_VALUES] as [string, ...string[]], {
      message: 'Platform must be one of: Google Meet, Microsoft Teams, Zoom, Other',
    })
    .optional(),
  dateFrom: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), 'Invalid dateFrom')
    .optional(),
  dateTo: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), 'Invalid dateTo')
    .optional(),
  sort: z
    .enum([...SORT_VALUES] as [string, ...string[]])
    .default('newest'),
});

export type InterviewQuery = z.infer<typeof interviewQuerySchema>;
export type CreateInterviewInput = z.infer<typeof createInterviewSchema>;
export type UpdateInterviewInput = z.infer<typeof updateInterviewSchema>;

// ─── ObjectId param validation ───────────────────────────────

export const objectIdSchema = z
  .string()
  .regex(/^[a-fA-F0-9]{24}$/, 'Invalid resource identifier');
