import { z } from 'zod';

export const createJobSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  jobType: z.string().default('Full-time'),
  location: z.string().min(2),
  salaryMin: z.coerce.number().positive(),
  salaryMax: z.coerce.number().positive(),
  minCgpa: z.coerce.number().min(0).max(10),
  maxBacklogs: z.coerce.number().int().min(0).default(0),
  applicationStart: z.string().datetime().or(z.string()),
  applicationEnd: z.string().datetime().or(z.string()),
  branches: z.array(z.string()).min(1, 'At least one branch must be allowed'),
  skills: z.array(z.string()).min(1, 'At least one skill is required'),
});

export const updateJobSchema = createJobSchema.partial().extend({
  status: z.enum(['DRAFT', 'ACTIVE', 'CLOSED']).optional(),
});

export const queryJobSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  branch: z.string().optional(),
  status: z.enum(['ALL', 'DRAFT', 'ACTIVE', 'CLOSED']).optional(),
});

export default {
  createJobSchema,
  updateJobSchema,
  queryJobSchema,
};
