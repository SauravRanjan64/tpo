import { db } from '../../config/database.js';
import { evaluateEligibility, createEligibilitySnapshot } from '../eligibility/eligibility.service.js';
import { validateStatusTransition, APPLICATION_STATUS } from './statusTransition.service.js';
import { calculateSkillMatch } from '../resumeMatcher/resumeMatcher.service.js';
import AuditService from '../audit/audit.service.js';
import NotificationService from '../notifications/notification.service.js';
import { sanitizeStudentProfile } from '../../utils/privacy.util.js';
import { emitNewApplicantToCompany } from '../../socket/socket.server.js';

export class ApplicationService {
  /**
   * Submits a placement application inside a database transaction
   */
  static async applyToJob(studentUserId, jobId, options = {}, reqMeta = {}) {
    // 1. Load Student
    const student = await db.student.findUnique({
      where: { userId: studentUserId },
      include: {
        resumes: true,
        consents: true,
      },
    });

    if (!student) {
      return {
        success: false,
        code: 'PROFILE_INCOMPLETE',
        message: 'Student profile not found. Please complete your profile first.',
      };
    }

    // 2. Check Consent
    const activeConsent = await db.consent.findFirst({
      where: { studentId: student.id, accepted: true },
    });

    // 3. Load Job
    const job = await db.jobDrive.findUnique({
      where: { id: jobId },
      include: {
        company: true,
        branches: true,
        skills: true,
      },
    });

    if (!job) {
      return {
        success: false,
        code: 'JOB_NOT_FOUND',
        message: 'The requested job drive does not exist.',
      };
    }

    // 4. Check Duplicate Application
    const existingApp = await db.application.findUnique({
      where: {
        studentId_jobId: {
          studentId: student.id,
          jobId: job.id,
        },
      },
    });

    if (existingApp) {
      return {
        success: false,
        code: 'APPLICATION_DUPLICATE',
        message: 'You have already applied for this placement drive.',
      };
    }

    // 5. Run Eligibility Engine
    const eligibilityResult = evaluateEligibility(student, job, {
      hasApplied: Boolean(existingApp),
      hasConsent: Boolean(activeConsent),
    });

    if (!eligibilityResult.eligible) {
      return {
        success: false,
        code: 'APPLICATION_NOT_ELIGIBLE',
        message: 'You are not eligible for this job.',
        errors: eligibilityResult.reasons,
      };
    }

    // 6. Resume & Match Score
    const resume = student.resumes?.[0] || null;
    let matchScore = null;
    if (resume) {
      const match = calculateSkillMatch(resume.skills || [], job.skills || []);
      matchScore = match.score;

      // Save match assistively
      await db.resumeMatch.create({
        data: {
          resumeId: resume.id,
          jobId: job.id,
          score: match.score,
          matchedSkills: match.matchedSkills,
          missingSkills: match.missingSkills,
        },
      });
    }

    // 7. Save immutable snapshot
    const eligibilitySnapshot = createEligibilitySnapshot(student, job, eligibilityResult);

    // 8. Execute within transaction
    const application = await db.$transaction(async (tx) => {
      // Create Application
      const app = await tx.application.create({
        data: {
          studentId: student.id,
          jobId: job.id,
          status: APPLICATION_STATUS.APPLIED,
          eligibilitySnapshot,
          resumeId: resume?.id || null,
          matchScore,
        },
      });

      // Create Audit Log
      await AuditService.record(
        {
          userId: studentUserId,
          action: 'APPLICATION_CREATED',
          entityType: 'Application',
          entityId: app.id,
          metadata: { jobId: job.id, jobTitle: job.title, studentId: student.id },
          ipAddress: reqMeta.ipAddress,
          userAgent: reqMeta.userAgent,
        },
        tx
      );

      // Create Notification for Student
      await NotificationService.send(
        {
          userId: studentUserId,
          type: 'APPLICATION_SUBMITTED',
          title: 'Application Submitted',
          message: `Your application for ${job.title} at ${job.company?.companyName || 'the recruiting company'} was submitted successfully.`,
        },
        tx
      );

      return app;
    });

    // Real-time alert to company
    emitNewApplicantToCompany(job.companyId, {
      applicationId: application.id,
      jobId: job.id,
      jobTitle: job.title,
      studentName: student.fullName,
      appliedAt: application.appliedAt,
    });

    return {
      success: true,
      message: 'Application submitted successfully.',
      application,
    };
  }

  /**
   * Updates application status with state machine and company ownership checks
   */
  static async updateApplicationStatus(applicationId, newStatus, user, reason = '', reqMeta = {}) {
    // Load application with job and company
    const application = await db.application.findUnique({
      where: { id: applicationId },
      include: {
        job: {
          include: {
            company: true,
          },
        },
        student: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!application) {
      return {
        success: false,
        code: 'RESOURCE_NOT_FOUND',
        message: 'Application not found.',
      };
    }

    // Company ownership verification (Requirement #38)
    if (user.role === 'COMPANY') {
      const companyUserMatches = application.job?.company?.userId === user.id;
      if (!companyUserMatches) {
        return {
          success: false,
          code: 'AUTH_FORBIDDEN',
          message: 'Forbidden: You can only manage applications submitted to your company\'s jobs.',
        };
      }
    } else if (user.role === 'STUDENT') {
      if (application.student?.userId !== user.id) {
        return {
          success: false,
          code: 'AUTH_FORBIDDEN',
          message: 'Students can only withdraw their own applications.',
        };
      }
      if (newStatus !== APPLICATION_STATUS.WITHDRAWN) {
        return {
          success: false,
          code: 'AUTH_FORBIDDEN',
          message: 'Students can only withdraw applications.',
        };
      }
    } else if (user.role !== 'ADMIN') {
      return {
        success: false,
        code: 'AUTH_FORBIDDEN',
        message: 'Unauthorized to update application status.',
      };
    }

    // State machine validation (Requirement #18)
    const transitionCheck = validateStatusTransition(application.status, newStatus, user.role);
    if (!transitionCheck.valid) {
      return {
        success: false,
        code: 'INVALID_STATUS_TRANSITION',
        message: transitionCheck.message,
      };
    }

    // Determine timestamps
    const updatePayload = { status: newStatus };
    if (newStatus === APPLICATION_STATUS.SHORTLISTED) {
      updatePayload.shortlistedAt = new Date();
    } else if (newStatus === APPLICATION_STATUS.REJECTED) {
      updatePayload.rejectedAt = new Date();
    }

    // Transactional update
    const updatedApplication = await db.$transaction(async (tx) => {
      const updated = await tx.application.update({
        where: { id: applicationId },
        data: updatePayload,
      });

      // Audit log
      await AuditService.record(
        {
          userId: user.id,
          action: `APPLICATION_${newStatus}`,
          entityType: 'Application',
          entityId: applicationId,
          metadata: {
            previousStatus: application.status,
            newStatus,
            reason: reason || undefined,
            jobTitle: application.job?.title,
          },
          ipAddress: reqMeta.ipAddress,
          userAgent: reqMeta.userAgent,
        },
        tx
      );

      // Notification for student
      const studentUserId = application.student?.userId;
      if (studentUserId) {
        await NotificationService.send(
          {
            userId: studentUserId,
            type: `APPLICATION_${newStatus}`,
            title: `Application ${newStatus.charAt(0) + newStatus.slice(1).toLowerCase()}`,
            message: `Your application for ${application.job?.title} has been updated to ${newStatus}.${reason ? ` Note: ${reason}` : ''}`,
          },
          tx
        );
      }

      return updated;
    });

    return {
      success: true,
      message: `Application status updated to ${newStatus}.`,
      application: updatedApplication,
    };
  }

  /**
   * Retrieves applications for the logged-in student
   */
  static async getStudentApplications(studentId) {
    const apps = await db.application.findMany({
      where: { studentId },
      include: {
        job: {
          include: {
            company: true,
          },
        },
      },
    });

    return apps.map(app => ({
      id: app.id,
      jobId: app.jobId,
      jobTitle: app.job?.title,
      companyName: app.job?.company?.companyName,
      location: app.job?.location,
      status: app.status,
      matchScore: app.matchScore,
      appliedAt: app.appliedAt,
      shortlistedAt: app.shortlistedAt,
      rejectedAt: app.rejectedAt,
      eligibilitySnapshot: app.eligibilitySnapshot,
    }));
  }

  /**
   * Retrieves applications for a company's jobs with contact privacy masking
   */
  static async getCompanyApplicants(companyUserId, query = {}) {
    const company = await db.company.findUnique({ where: { userId: companyUserId } });
    if (!company) {
      throw new Error('Company not found.');
    }

    const { jobId, status, branch, search, page = 1, limit = 20 } = query;

    // Load applications for this company's jobs
    let apps = await db.application.findMany({
      where: status ? { status } : {},
      include: {
        job: true,
        student: {
          include: {
            user: true,
            resumes: true,
          },
        },
      },
    });

    // Filter strictly by company
    apps = apps.filter(a => a.job?.companyId === company.id);

    if (jobId) {
      apps = apps.filter(a => a.jobId === jobId);
    }

    if (branch) {
      apps = apps.filter(a => a.student?.branch?.toUpperCase() === branch.toUpperCase());
    }

    if (search) {
      const q = search.toLowerCase();
      apps = apps.filter(
        a =>
          a.student?.fullName?.toLowerCase().includes(q) ||
          a.student?.rollNumber?.includes(q) ||
          a.job?.title?.toLowerCase().includes(q)
      );
    }

    const total = apps.length;
    const startIndex = (page - 1) * limit;
    const paginated = apps.slice(startIndex, startIndex + limit);

    // Privacy Masking (Requirement #41)
    const sanitizedList = paginated.map(a => {
      // Full contact is only unmasked if SHORTLISTED or SELECTED
      const isShortlistedOrSelected =
        a.status === APPLICATION_STATUS.SHORTLISTED || a.status === APPLICATION_STATUS.SELECTED;

      const sanitizedStudent = sanitizeStudentProfile(a.student, isShortlistedOrSelected);

      return {
        id: a.id,
        studentId: a.studentId,
        studentName: sanitizedStudent.fullName,
        rollNumber: sanitizedStudent.rollNumber,
        branch: sanitizedStudent.branch,
        cgpa: sanitizedStudent.cgpa,
        activeBacklogs: sanitizedStudent.activeBacklogs,
        phone: sanitizedStudent.phone, // Masked if APPLIED
        jobId: a.jobId,
        jobTitle: a.job?.title,
        status: a.status,
        matchScore: a.matchScore,
        appliedAt: a.appliedAt,
        shortlistedAt: a.shortlistedAt,
        resumeUrl: a.student?.resumes?.[0] ? `/api/resumes/download/${a.student.resumes[0].id}` : null,
      };
    });

    return {
      applicants: sanitizedList,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getApplicationById(id, user) {
    const app = await db.application.findUnique({
      where: { id },
      include: {
        job: { include: { company: true } },
        student: { include: { user: true, resumes: true } },
      },
    });

    if (!app) return null;

    // Authorization check
    if (user.role === 'STUDENT' && app.student?.userId !== user.id) {
      return { unauthorized: true };
    }
    if (user.role === 'COMPANY' && app.job?.company?.userId !== user.id) {
      return { unauthorized: true };
    }

    const isFullAccess =
      user.role === 'ADMIN' ||
      (user.role === 'COMPANY' &&
        (app.status === APPLICATION_STATUS.SHORTLISTED || app.status === APPLICATION_STATUS.SELECTED)) ||
      user.role === 'STUDENT';

    const sanitizedStudent = sanitizeStudentProfile(app.student, isFullAccess);

    return {
      ...app,
      student: sanitizedStudent,
    };
  }
}

export default ApplicationService;
