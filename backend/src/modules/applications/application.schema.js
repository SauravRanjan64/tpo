import { z } from 'zod';
import { APPLICATION_STATUS } from './statusTransition.service.js';

export const applyJobSchema = z.object({
  jobId: z.string().min(1, 'Job ID is required').optional(), // can be in params or body
  resumeId: z.string().optional(),
}).default({});

export const updateApplicationStatusSchema = z.object({
  status: z.enum([
    APPLICATION_STATUS.SHORTLISTED,
    APPLICATION_STATUS.REJECTED,
    APPLICATION_STATUS.SELECTED,
  ]),
  reason: z.string().max(500).optional(),
});

export const queryApplicationsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  jobId: z.string().optional(),
  status: z.enum([
    APPLICATION_STATUS.APPLIED,
    APPLICATION_STATUS.SHORTLISTED,
    APPLICATION_STATUS.REJECTED,
    APPLICATION_STATUS.SELECTED,
  ]).or(z.literal('ALL')).optional(),
  branch: z.string().optional(),
  search: z.string().optional(),
  minCgpa: z.coerce.number().min(0).max(10).optional(),
  maxCgpa: z.coerce.number().min(0).max(10).optional(),
  batch: z.coerce.number().int().min(2020).max(2035).optional(),
  maxBacklogs: z.coerce.number().int().min(0).optional(),
  minMatchScore: z.coerce.number().min(0).max(100).optional(),
  maxMatchScore: z.coerce.number().min(0).max(100).optional(),
});

export default {
  applyJobSchema,
  updateApplicationStatusSchema,
  queryApplicationsSchema,
};
