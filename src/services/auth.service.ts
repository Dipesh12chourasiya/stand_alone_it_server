import { Recruiter, type IRecruiter } from '@/models/recruiter.model';
import { generateAccessToken } from '@/utils/jwt';
import { comparePassword } from '@/utils/password';
import { HTTP_STATUS, ROLES } from '@/constants';
import type { AuthResult, RecruiterProfile } from '@/interfaces';
import type { RegisterInput, LoginInput } from '@/validators/auth.validator';

// ─── Domain Error ───────────────────────────────────────────

export class AuthError extends Error {
  public readonly statusCode: number;
  public readonly errors: string[];

  constructor(message: string, statusCode: number, errors: string[] = []) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

// ─── Helpers ────────────────────────────────────────────────

function toProfile(recruiter: IRecruiter): RecruiterProfile {
  return {
    id: String(recruiter._id),
    name: recruiter.name,
    email: recruiter.email,
    company: recruiter.company,
    role: recruiter.role,
    avatar: recruiter.avatar || undefined,
    createdAt: recruiter.createdAt,
    updatedAt: recruiter.updatedAt,
  };
}

// ─── Register ───────────────────────────────────────────────

export async function register(input: RegisterInput): Promise<AuthResult> {
  const { name, email, password, company, avatar } = input;

  // Check if the email is already registered
  const existingRecruiter = await Recruiter.findOne({ email });
  if (existingRecruiter) {
    throw new AuthError(
      'An account with this email already exists.',
      HTTP_STATUS.CONFLICT,
      ['email is already registered'],
    );
  }

  // Create the recruiter document
  const recruiter = await Recruiter.create({
    name,
    email,
    password,
    company,
    role: ROLES.RECRUITER,
    avatar: avatar || '',
  });

  // Generate JWT
  const accessToken = generateAccessToken({
    recruiterId: String(recruiter._id),
    role: recruiter.role,
  });

  return {
    recruiter: {
      id: String(recruiter._id),
      name: recruiter.name,
      email: recruiter.email,
      company: recruiter.company,
      role: recruiter.role,
      avatar: recruiter.avatar || undefined,
      createdAt: recruiter.createdAt,
    },
    accessToken,
  };
}

// ─── Login ──────────────────────────────────────────────────

export async function login(input: LoginInput): Promise<AuthResult> {
  const { email, password } = input;

  // Find the recruiter — explicitly select password since it's excluded by default
  const recruiter = await Recruiter.findOne({ email }).select('+password');
  if (!recruiter) {
    throw new AuthError('Invalid email or password.', HTTP_STATUS.UNAUTHORIZED);
  }

  // Verify password
  const isMatch = await comparePassword(password, recruiter.password);
  if (!isMatch) {
    throw new AuthError('Invalid email or password.', HTTP_STATUS.UNAUTHORIZED);
  }

  // Generate JWT
  const accessToken = generateAccessToken({
    recruiterId: String(recruiter._id),
    role: recruiter.role,
  });

  return {
    recruiter: {
      id: String(recruiter._id),
      name: recruiter.name,
      email: recruiter.email,
      company: recruiter.company,
      role: recruiter.role,
      avatar: recruiter.avatar || undefined,
      createdAt: recruiter.createdAt,
    },
    accessToken,
  };
}

// ─── Get Profile ────────────────────────────────────────────

export async function getProfile(recruiterId: string): Promise<RecruiterProfile> {
  const recruiter = await Recruiter.findById(recruiterId);

  if (!recruiter) {
    throw new AuthError('Recruiter not found.', HTTP_STATUS.NOT_FOUND);
  }

  return toProfile(recruiter);
}
