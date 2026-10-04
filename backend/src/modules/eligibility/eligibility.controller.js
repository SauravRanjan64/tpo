import ApiResponse from '../../utils/apiResponse.js';
import { db } from '../../config/database.js';
import EligibilityService from './eligibility.service.js';
import StudentService from '../students/student.service.js';
import JobService from '../jobs/job.service.js';

/**
 * Eligibility Controller
 * Provides endpoint for students to query eligibility for a specific job drive.
 */
export class EligibilityController {
  /**
   * GET /api/eligibility/:jobId
   * Returns eligibility snapshot for the logged‑in student.
   */
  static async getEligibility(req, res, next) {
    try {
      const studentUserId = req.user.id; // user id from auth middleware
      const { jobId } = req.params;

      // Fetch student profile and job drive
      const [student, job] = await Promise.all([
        StudentService.getProfileByUserId(studentUserId),
        JobService.getJobById(jobId),
      ]);

      // Determine if the student has already applied to this job
      const existingApp = await db.application.findUnique({
        where: {
          studentId_jobId: {
            studentId: (await db.student.findUnique({ where: { userId: studentUserId } })).id,
            jobId: Number(jobId),
          },
        },
      });
      const hasApplied = Boolean(existingApp);

      // Check if the student has given consent (data policy)
      const consent = await db.consent.findFirst({
        where: { studentId: (await db.student.findUnique({ where: { userId: studentUserId } })).id, accepted: true },
      });
      const hasConsent = Boolean(consent);

      const result = EligibilityService.evaluateEligibility(student, job, { hasApplied, hasConsent });

      return ApiResponse.success(res, 'Eligibility evaluated.', { eligibility: result });
    } catch (err) {
      next(err);
    }
  }
}

export default EligibilityController;
