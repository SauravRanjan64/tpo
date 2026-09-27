import { z } from 'zod';

export const idParamSchema = z.object({
  id: z.string().min(1),
});

export const jobIdParamSchema = z.object({
  jobId: z.string().min(1),
});
