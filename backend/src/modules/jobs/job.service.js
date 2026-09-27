import { db } from '../../config/database.js';
import { evaluateEligibility } from '../eligibility/eligibility.service.js';
import AuditService from '../audit/audit.service.js';

export class JobService {
  static async getJobs(query = {}, userRole = 'PUBLIC') {
    const { page = 1, limit = 20, search, branch, jobType, status: rawStatus = 'ACTIVE' } = query;
    const status = rawStatus === 'ALL' ? undefined : rawStatus;

    let jobs = await db.jobDrive.findMany({
      where: status ? { status } : {},
      include: {
        company: true,
        branches: true,
        skills: true,
      },
    });
    if (userRole !== 'ADMIN') jobs = jobs.filter((job) => job.status !== 'DRAFT');

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

    if (branch && branch !== 'ALL') {
      const bQuery = branch.toUpperCase();
      jobs = jobs.filter(j => j.branches?.some(b => b.branch.toUpperCase() === bQuery));
    }
    if (jobType && jobType !== 'ALL') {
      jobs = jobs.filter((job) => job.jobType?.toLowerCase() === jobType.toLowerCase());
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

  static async createJob(jobData, userId, reqMeta = {}, userRole = 'ADMIN') {
    let companyId;
    if (userRole === 'COMPANY') {
      const company = await db.company.findUnique({ where: { userId } });
      if (!company) {
        throw new Error('Company profile not found for user.');
      }
      companyId = company.id;
    } else {
      if (!jobData.companyId) {
        const error = new Error('Select a company for this Job Drive.');
        error.status = 400;
        throw error;
      }
      const company = await db.company.findUnique({ where: { id: jobData.companyId } });
      if (!company) {
        const error = new Error('Selected company was not found.');
        error.status = 400;
        throw error;
      }
      companyId = company.id;
    }

    const branchesCreate = (jobData.branches || []).map(branch => ({ branch: branch.trim().toUpperCase() }));
    const skillsCreate = (jobData.skills || []).map(skill => ({ skill: skill.trim() }));

    const job = await db.$transaction(async (tx) => {
      const created = await tx.jobDrive.create({
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
        eligibleBatches: jobData.eligibleBatches || [],
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

      await AuditService.record({
        userId,
        action: 'JOB_CREATED',
        entityType: 'JobDrive',
        entityId: created.id,
        metadata: { title: created.title, companyId },
        ipAddress: reqMeta.ipAddress,
        userAgent: reqMeta.userAgent,
      }, tx);
      return created;
    });

    return job;
  }

  static async updateJob(id, updateData, userId, reqMeta = {}, userRole = 'ADMIN') {
    const { branches, skills, ...jobFields } = updateData;
    const job = await db.jobDrive.findUnique({ where: { id } });
    if (!job) {
      throw new Error('Job drive not found.');
    }

    if (userRole === 'COMPANY') {
      const company = await db.company.findUnique({ where: { userId } });
      if (!company || job.companyId !== company.id) {
        const error = new Error('You can only update your own job drives.');
        error.status = 403;
        throw error;
      }
      // A company cannot transfer a drive to another company.
      delete jobFields.companyId;
    } else if (jobFields.companyId) {
      const company = await db.company.findUnique({ where: { id: jobFields.companyId } });
      if (!company) {
        const error = new Error('Selected company was not found.');
        error.status = 400;
        throw error;
      }
    }

    const updatedJob = await db.$transaction(async (tx) => {
      await tx.jobDrive.update({
        where: { id },
        data: jobFields,
      });

      if (branches) {
        await tx.jobBranch.deleteMany({ where: { jobId: id } });
        await Promise.all(branches.map((branch) => tx.jobBranch.create({
          data: { jobId: id, branch: branch.trim().toUpperCase() },
        })));
      }
      if (skills) {
        await tx.jobSkill.deleteMany({ where: { jobId: id } });
        await Promise.all(skills.map((skill) => tx.jobSkill.create({
          data: { jobId: id, skill: skill.trim() },
        })));
      }

      await AuditService.record({
        userId,
        action: 'JOB_UPDATED',
        entityType: 'JobDrive',
        entityId: id,
        metadata: Object.keys({ ...jobFields, branches, skills }),
        ipAddress: reqMeta.ipAddress,
        userAgent: reqMeta.userAgent,
      }, tx);

      return tx.jobDrive.findUnique({
        where: { id },
        include: { company: true, branches: true, skills: true },
      });
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
