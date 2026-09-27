import { Router } from 'express';
import AdminController from './admin.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/rbac.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { createJobSchema, queryJobSchema } from '../jobs/job.schema.js';
import { queryApplicationsSchema } from '../applications/application.schema.js';
import { z } from 'zod';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/stats', AdminController.getStats);
router.get('/students', validate(z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  branch: z.string().optional(),
  batch: z.coerce.number().int().min(2020).max(2035).optional(),
}), 'query'), AdminController.getStudents);
router.get('/companies', AdminController.getCompanies);
router.patch('/companies/:id/verify', validate(z.object({ id: z.string().min(1) }), 'params'), AdminController.verifyCompany);
router.get('/jobs', validate(queryJobSchema, 'query'), AdminController.getJobs);
router.post('/jobs', validate(createJobSchema), AdminController.createJob);
router.get('/applications', validate(queryApplicationsSchema, 'query'), AdminController.getApplications);
router.get('/applications/export', validate(queryApplicationsSchema, 'query'), AdminController.exportCsv);
router.get('/exports/csv', validate(queryApplicationsSchema, 'query'), AdminController.exportCsv); // Compatibility alias
router.get('/audit', AdminController.getAuditLogs);

export default router;
