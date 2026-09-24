import { db } from '../../config/database.js';
import { evaluateEligibility } from '../eligibility/eligibility.service.js';
import AuditService from '../audit/audit.service.js';

export class JobService {
  static async getJobs(query = {}) {
    const { page = 1, limit = 20, search, branch, status: rawStatus = 'ACTIVE' } = query;
    const status = rawStatus === 'ALL' ? undefined : rawStatus;

    let jobs = await db.jobDrive.findMany({
      where: status ? { status } : {},
      include: {
        company: true,
        branches: true,
        skills: true,
      },
    });

    // In-database / in-memory search filtering
    if (search) {
      const q = search.toLowerCase();
      jobs = jobs.filter(
        j =>
          j.title.toLowerCase().includes(q) ||
          j.description.toLowerCase().includes(q) ||
          j.company?.companyName?.toLowerCase().includes(q) ||
          j.location.toLowerCase().includes(q)
      );
    }

    if (branch) {
      const bQuery = branch.toUpperCase();
      jobs = jobs.filter(j => j.branches?.some(b => b.branch.toUpperCase() === bQuery));
    }

    const total = jobs.length;
    const startIndex = (page - 1) * limit;
    const paginatedJobs = jobs.slice(startIndex, startIndex + limit);

    return {
      jobs: paginatedJobs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getJobById(id) {
    return await db.jobDrive.findUnique({
      where: { id },
      include: {
        company: true,
        branches: true,
        skills: true,
        applications: true,
      },
    });
  }

  static async createJob(jobData, userId, reqMeta = {}) {
    // Resolve companyId: if user is COMPANY, lookup company. If ADMIN, can pass companyId
    let companyId = jobData.companyId;
    if (!companyId) {
      const company = await db.company.findUnique({ where: { userId } });
      if (!company) {
        throw new Error('Company profile not found for user.');
      }
      companyId = company.id;
    }

    const branchesCreate = (jobData.branches || []).map(branch => ({ branch: branch.trim().toUpperCase() }));
    const skillsCreate = (jobData.skills || []).map(skill => ({ skill: skill.trim() }));

    const job = await db.jobDrive.create({
      data: {
        companyId,
        title: jobData.title,
        description: jobData.description,
        jobType: jobData.jobType || 'Full-time',
        location: jobData.location,
        salaryMin: jobData.salaryMin,
        salaryMax: jobData.salaryMax,
        minCgpa: jobData.minCgpa,
        maxBacklogs: jobData.maxBacklogs ?? 0,
        applicationStart: new Date(jobData.applicationStart),
        applicationEnd: new Date(jobData.applicationEnd),
        status: jobData.status || 'ACTIVE',
        branches: {
          create: branchesCreate,
        },
        skills: {
          create: skillsCreate,
        },
      },
    });

    // Record audit log
    await AuditService.record({
      userId,
      action: 'JOB_CREATED',
      entityType: 'JobDrive',
      entityId: job.id,
      metadata: { title: job.title, companyId },
      ipAddress: reqMeta.ipAddress,
      userAgent: reqMeta.userAgent,
    });

    return job;
  }

  static async updateJob(id, updateData, userId, reqMeta = {}) {
    const job = await db.jobDrive.findUnique({ where: { id } });
    if (!job) {
      throw new Error('Job drive not found.');
    }

    const updatedJob = await db.jobDrive.update({
      where: { id },
      data: updateData,
    });

    await AuditService.record({
      userId,
      action: 'JOB_UPDATED',
      entityType: 'JobDrive',
      entityId: id,
      metadata: updateData,
      ipAddress: reqMeta.ipAddress,
      userAgent: reqMeta.userAgent,
    });

    return updatedJob;
  }

  /**
   * Evaluates eligibility for a student for a specific job drive without applying
   */
  static async checkJobEligibility(jobId, studentUserId) {
    const job = await db.jobDrive.findUnique({
      where: { id: jobId },
      include: {
        branches: true,
        skills: true,
        company: true,
      },
    });

    if (!job) {
      return {
        found: false,
        result: {
          eligible: false,
          reasons: [{ rule: 'JOB_NOT_FOUND', required: 'Job exists', actual: 'Missing', message: 'Job not found.' }],
          checkedAt: new Date().toISOString(),
          rulesVersion: 'V2',
        },
      };
    }

    const student = await db.student.findUnique({
      where: { userId: studentUserId },
      include: { consents: true },
    });

    if (!student) {
      return {
        found: true,
        result: {
          eligible: false,
          reasons: [{ rule: 'STUDENT_NOT_FOUND', required: 'Student profile', actual: 'Missing', message: 'Student profile not found.' }],
          checkedAt: new Date().toISOString(),
          rulesVersion: 'V2',
        },
      };
    }

    // Check duplicate application
    const existingApp = await db.application.findUnique({
      where: {
        studentId_jobId: {
          studentId: student.id,
          jobId: job.id,
        },
      },
    });

    // Check consent
    const hasConsent = await db.consent.findFirst({
      where: { studentId: student.id, accepted: true },
    });

    const result = evaluateEligibility(student, job, {
      hasApplied: Boolean(existingApp),
      hasConsent: Boolean(hasConsent),
    });

    return {
      found: true,
      job,
      student,
      result,
    };
  }
}

export default JobService;
