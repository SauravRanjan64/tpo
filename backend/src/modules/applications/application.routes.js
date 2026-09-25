import { Router } from 'express';
import ApplicationController from './application.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/rbac.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { applyJobSchema, updateApplicationStatusSchema } from './application.schema.js';

const router = Router();

router.use(authenticate);

// Student apply & view my applications
router.post('/', authorize('STUDENT'), validate(applyJobSchema), ApplicationController.applyToJob);
router.get('/my', authorize('STUDENT'), ApplicationController.getMyApplications);

// View specific application
router.get('/:id', ApplicationController.getApplicationById);

// Update status (Company & Admin) - Requirement #37
router.patch(
  '/:id/status',
  authorize('STUDENT', 'COMPANY', 'ADMIN'),
  validate(updateApplicationStatusSchema),
  ApplicationController.updateStatus
);

export default router;
