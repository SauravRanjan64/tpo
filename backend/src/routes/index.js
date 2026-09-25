import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes.js';
import studentRoutes from '../modules/students/student.routes.js';
import companyRoutes from '../modules/companies/company.routes.js';
import jobRoutes from '../modules/jobs/job.routes.js';
import applicationRoutes from '../modules/applications/application.routes.js';
import resumeRoutes from '../modules/resumes/resume.routes.js';
import notificationRoutes from '../modules/notifications/notification.routes.js';
import adminRoutes from '../modules/admin/admin.routes.js';
import analyticsRoutes from '../modules/analytics/analytics.routes.js';
import auditRoutes from '../modules/audit/audit.routes.js';
import { db, getDatabaseStatus } from '../config/database.js';

const router = Router();

// Health Check (Requirement #68)
router.get('/health', async (req, res) => {
  let dbStatus = getDatabaseStatus();
  try {
    // Quick test count
    await db.user.count();
  } catch (err) {
    dbStatus = 'degraded';
  }

  return res.status(200).json({
    status: 'ok',
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

// Mount modular monolith routers (Requirement #57)
router.use('/auth', authRoutes);
router.use('/students', studentRoutes);
router.use('/student', studentRoutes); // Compatibility alias
router.use('/companies', companyRoutes);
router.use('/company', companyRoutes); // Compatibility alias
router.use('/jobs', jobRoutes);
router.use('/applications', applicationRoutes);
router.use('/resumes', resumeRoutes);
router.use('/resume', resumeRoutes); // Compatibility alias
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/audit', auditRoutes);

export default router;
