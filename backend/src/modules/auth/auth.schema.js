import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().email('Valid institutional email is required').transform((email) => email.toLowerCase()),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const consentSchema = z.object({
  agreed: z.boolean().default(true),
  version: z.string().default('V2'),
});

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['STUDENT', 'COMPANY']),
  rollNumber: z.string().optional(),
  branch: z.string().optional(),
  batch: z.coerce.number().optional(),
  companyName: z.string().optional(),
});

export default {
  loginSchema,
  consentSchema,
  registerSchema,
};
