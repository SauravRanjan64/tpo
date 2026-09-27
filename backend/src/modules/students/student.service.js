import { db } from '../../config/database.js';
import AuditService from '../audit/audit.service.js';
import { evaluateEligibility } from '../eligibility/eligibility.service.js';

export class StudentService {
  /**
   * Loads student profile by userId
   */
  static async getProfileByUserId(userId) {
    const student = await db.student.findUnique({
      where: { userId },
      include: {
        user: true,
        resumes: true,
        consents: true,
      },
    });

    if (!student) return null;

    // Check if consent is active
    const activeConsent = await db.consent.findFirst({
      where: { studentId: student.id, accepted: true },
    });

    const activeResume = student.resumes?.[0] || null;

    return {
      ...student,
      consentGiven: Boolean(activeConsent),
      resume: activeResume
        ? {
            id: activeResume.id,
            fileName: activeResume.fileName,
            fileSize: `${(activeResume.fileSize / (1024 * 1024)).toFixed(1)} MB`,
            uploadDate: activeResume.createdAt?.toISOString().split('T')[0],
            skills: activeResume.skills || [],
          }
        : null,
    };
  }

  /**
   * Updates student profile
   */
  static async updateProfile(userId, updateData, reqMeta = {}) {
    const student = await db.student.findUnique({ where: { userId } });
    if (!student) {
      throw new Error('Student profile not found.');
    }

    const updatedProfile = { ...student, ...updateData };
    const requiredProfileFields = ['fullName', 'rollNumber', 'branch', 'batch', 'cgpa', 'phone'];
    const profileComplete = requiredProfileFields.every((field) => {
      const value = updatedProfile[field];
      return value !== undefined && value !== null && String(value).trim() !== '';
    });

    const updatedStudent = await db.student.update({
      where: { id: student.id },
      data: {
        ...updateData,
        profileComplete,
      },
    });

    // Record audit log
    await AuditService.record({
      userId,
      action: 'PROFILE_UPDATED',
      entityType: 'Student',
      entityId: student.id,
      metadata: Object.keys(updateData),
      ipAddress: reqMeta.ipAddress,
      userAgent: reqMeta.userAgent,
    });

    return updatedStudent;
  }

  /**
   * Retrieves summary statistics for student dashboard
   */
  static async getStudentStats(studentId) {
    const applications = await db.application.findMany({
      where: { studentId },
    });

    const totalApplied = applications.length;
    const shortlisted = applications.filter(a => a.status === 'SHORTLISTED').length;
    const selected = applications.filter(a => a.status === 'SELECTED').length;
    const rejected = applications.filter(a => a.status === 'REJECTED').length;

    // Count eligible active job drives
    const activeJobs = await db.jobDrive.findMany({
      where: { status: 'ACTIVE' },
      include: { branches: true },
    });

    const student = await db.student.findUnique({ where: { id: studentId } });

    let eligibleJobsCount = 0;
    if (student) {
      const activeConsent = await db.consent.findFirst({
        where: { studentId: student.id, accepted: true },
      });
      for (const job of activeJobs) {
        const hasApplied = applications.some((application) => application.jobId === job.id);
        if (evaluateEligibility(student, job, {
          hasConsent: Boolean(activeConsent),
          hasApplied,
        }).eligible) {
          eligibleJobsCount++;
        }
      }
    }

    return {
      totalApplied,
      shortlisted,
      selected,
      rejected,
      eligibleJobsCount,
      activeDrivesCount: activeJobs.length,
    };
  }
}

export default StudentService;
