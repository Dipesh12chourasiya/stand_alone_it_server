import mongoose, { Schema, Document } from 'mongoose';
import { hashPassword } from '@/utils/password';
import { ROLES } from '@/constants';

// ─── Document Interface ─────────────────────────────────────

export interface IRecruiter extends Document {
  name: string;
  email: string;
  password: string;
  company: string;
  role: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}


const recruiterSchema = new Schema<IRecruiter>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name must not exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Never return password by default
    },
    company: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      maxlength: [200, 'Company name must not exceed 200 characters'],
    },
    role: {
      type: String,
      default: ROLES.RECRUITER,
      enum: [ROLES.RECRUITER],
    },
    avatar: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  },
);

recruiterSchema.pre<IRecruiter>('save', async function () {
  // Only hash when the password field is actually modified
  if (!this.isModified('password')) {
    return;
  }

  this.password = await hashPassword(this.password);
});


export const Recruiter = mongoose.model<IRecruiter>('Recruiter', recruiterSchema);
