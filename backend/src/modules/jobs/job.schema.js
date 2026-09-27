import { z } from 'zod';

const jobFieldsSchema = z.object({
  companyId: z.string().min(1).optional(),
  title: z.string().min(3),
  description: z.string().min(10),
  jobType: z.string().default('Full-time'),
  location: z.string().min(2),
  salaryMin: z.coerce.number().positive(),
  salaryMax: z.coerce.number().positive(),
  minCgpa: z.coerce.number().min(0).max(10),
  maxBacklogs: z.coerce.number().int().min(0).default(0),
  eligibleBatches: z.array(z.coerce.number().int().min(2020).max(2035)).default([]),
  applicationStart: z.string().refine((value) => !Number.isNaN(Date.parse(value)), 'Invalid start date'),
  applicationEnd: z.string().refine((value) => !Number.isNaN(Date.parse(value)), 'Invalid end date'),
  branches: z.array(z.string()).min(1, 'At least one branch must be allowed'),
  skills: z.array(z.string()).min(1, 'At least one skill is required'),
});

export const createJobSchema = jobFieldsSchema.refine((data) => new Date(data.applicationStart) < new Date(data.applicationEnd), {
  message: 'Application end date must be after the start date',
  path: ['applicationEnd'],
}).refine((data) => data.salaryMax >= data.salaryMin, {
  message: 'Maximum salary must be greater than or equal to minimum salary',
  path: ['salaryMax'],
});

export const updateJobSchema = jobFieldsSchema.partial().extend({
  companyId: z.string().min(1).optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'CLOSED']).optional(),
}).refine((data) => !data.applicationStart || !data.applicationEnd || new Date(data.applicationStart) < new Date(data.applicationEnd), {
  message: 'Application end date must be after the start date',
  path: ['applicationEnd'],
}).refine((data) => data.salaryMin == null || data.salaryMax == null || data.salaryMax >= data.salaryMin, {
  message: 'Maximum salary must be greater than or equal to minimum salary',
  path: ['salaryMax'],
});

export const queryJobSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  branch: z.string().optional(),
  jobType: z.string().optional(),
  status: z.enum(['ALL', 'DRAFT', 'ACTIVE', 'CLOSED']).optional(),
});

export default {
  createJobSchema,
  updateJobSchema,
  queryJobSchema,
};
