import { Router } from 'express';
import CompanyController from './company.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/rbac.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { updateCompanyProfileSchema } from './company.schema.js';
import { queryApplicationsSchema } from '../applications/application.schema.js';
import { z } from 'zod';

const router = Router();

router.use(authenticate);
router.use(authorize('COMPANY'));

router.get('/profile', CompanyController.getProfile);
router.put('/profile', validate(updateCompanyProfileSchema), CompanyController.updateProfile);
router.get('/stats', CompanyController.getStats);
router.get('/drives', CompanyController.getDrives);
router.get('/applicants', validate(queryApplicationsSchema, 'query'), CompanyController.getApplicants);
router.post(
  '/applications/:applicationId/shortlist',
  validate(z.object({ applicationId: z.string().min(1) }), 'params'),
  CompanyController.shortlistApplicant
);
router.post(
  '/applications/:applicationId/reject',
  validate(z.object({ applicationId: z.string().min(1) }), 'params'),
  validate(z.object({ reason: z.string().max(500).optional() }).default({})),
  CompanyController.rejectApplicant
);

export default router;
