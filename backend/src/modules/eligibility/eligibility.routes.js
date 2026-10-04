import { Router } from 'express';
import EligibilityController from './eligibility.controller.js';
import authenticate from '../../middleware/auth.middleware.js';
import authorize from '../../middleware/rbac.middleware.js';

const router = Router();

// Only students can check eligibility
router.get(
  '/:jobId',
  authenticate,
  authorize('STUDENT'),
  EligibilityController.getEligibility,
);

export default router;
