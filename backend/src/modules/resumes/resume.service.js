import { db } from '../../config/database.js';
import { calculateSkillMatch } from '../resumeMatcher/resumeMatcher.service.js';
import { extractResumeText, removeStoredResume, resolveStoredResumePath } from './resumeExtractor.service.js';
import AuditService from '../audit/audit.service.js';

export class ResumeService {
  static async getResumeByStudentId(studentId) {
    return await db.resume.findFirst({
      where: { studentId },
    });
  }

  static async saveUploadedResume(studentId, fileInfo, reqMeta = {}) {
    // Check if student already has a resume; if so, delete old record
    const existing = await db.resume.findFirst({ where: { studentId } });
    if (existing) await db.resume.delete({ where: { id: existing.id } });

    const resume = await db.resume.create({
      data: {
        studentId,
        fileName: fileInfo.originalname || fileInfo.fileName || 'resume.pdf',
        storageKey: fileInfo.filename || fileInfo.storageKey || `resume-${Date.now()}.pdf`,
        mimeType: fileInfo.mimetype || 'application/pdf',
        fileSize: fileInfo.size,
        skills: [],
      },
    });

    const student = await db.student.findUnique({ where: { id: studentId } });
    if (student) {
      await AuditService.record({
        userId: student.userId,
        action: 'RESUME_UPLOADED',
        entityType: 'Resume',
        entityId: resume.id,
        metadata: { fileName: resume.fileName, fileSize: resume.fileSize },
        ipAddress: reqMeta.ipAddress,
        userAgent: reqMeta.userAgent,
      });
    }

    if (existing) await removeStoredResume(existing.storageKey);
    return resume;
  }

  static async deleteResume(studentId, reqMeta = {}) {
    const existing = await db.resume.findFirst({ where: { studentId } });
    if (!existing) return null;

    await db.resume.delete({ where: { id: existing.id } });
    await removeStoredResume(existing.storageKey);

    const student = await db.student.findUnique({ where: { id: studentId } });
    if (student) {
      await AuditService.record({
        userId: student.userId,
        action: 'RESUME_DELETED',
        entityType: 'Resume',
        entityId: existing.id,
        ipAddress: reqMeta.ipAddress,
        userAgent: reqMeta.userAgent,
      });
    }

    return existing;
  }

  static async matchResumeAgainstJob(studentId, jobId) {
    const job = await db.jobDrive.findUnique({
      where: { id: jobId },
      include: { skills: true },
    });

    if (!job) {
      throw new Error('Job drive not found.');
    }

    const resume = await db.resume.findFirst({ where: { studentId } });
    if (!resume) throw new Error('Upload a resume before checking the match score.');
    const resumeText = await extractResumeText(resume.storageKey, resume.mimeType);
    const matchResult = calculateSkillMatch(resumeText, job.skills || []);

    return {
      jobId: job.id,
      jobTitle: job.title,
      ...matchResult,
    };
  }

  static async matchResumeToJob(resume, job) {
    const resumeText = await extractResumeText(resume.storageKey, resume.mimeType);
    return calculateSkillMatch(resumeText, job.skills || []);
  }

  static async getAuthorizedResumeFile(resumeId, user) {
    const resume = await db.resume.findUnique({ where: { id: resumeId } });
    if (!resume) return null;

    const student = await db.student.findUnique({ where: { id: resume.studentId } });
    if (!student) return null;

    let authorized = user.role === 'ADMIN'
      || (user.role === 'STUDENT' && student.userId === user.id);

    if (user.role === 'COMPANY') {
      const company = await db.company.findUnique({ where: { userId: user.id } });
      const applications = await db.application.findMany({
        where: { studentId: student.id },
        include: { job: true },
      });
      authorized = Boolean(company && applications.some((application) =>
        application.job?.companyId === company.id
      ));
    }

    if (!authorized) {
      const error = new Error('You are not authorized to access this resume.');
      error.status = 403;
      throw error;
    }

    return {
      filePath: resolveStoredResumePath(resume.storageKey),
      fileName: resume.fileName,
    };
  }
}

export default ResumeService;
