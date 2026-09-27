import { Router } from 'express';
import ResumeController from './resume.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/rbac.middleware.js';
import { handleResumeUpload } from '../../middleware/upload.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { z } from 'zod';

const router = Router();

router.use(authenticate);

// Student resume endpoints
router.get('/', authorize('STUDENT'), ResumeController.getResume);
router.post('/upload', authorize('STUDENT'), handleResumeUpload, ResumeController.uploadResume);
router.delete('/', authorize('STUDENT'), ResumeController.deleteResume);
router.get('/download/:id', authorize('STUDENT', 'COMPANY', 'ADMIN'), validate(z.object({ id: z.string().min(1) }), 'params'), ResumeController.downloadResume);
router.post('/match', authorize('STUDENT'), validate(z.object({ jobId: z.string().min(1) })), ResumeController.matchResume);

export default router;
