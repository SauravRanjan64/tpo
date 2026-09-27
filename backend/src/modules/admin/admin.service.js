import { stringify } from 'csv-stringify';
import { db } from '../../config/database.js';
import AuditService from '../audit/audit.service.js';

export class AdminService {
  static async getStudents(query = {}) {
    const { branch, batch, search, page = 1, limit = 20 } = query;

    let students = await db.student.findMany({
      include: { user: true },
    });

    if (branch) {
      students = students.filter(s => s.branch.toUpperCase() === branch.toUpperCase());
    }
    if (batch) {
      students = students.filter(s => s.batch === Number(batch));
    }
    if (search) {
      const q = search.toLowerCase();
      students = students.filter(
        s =>
          s.fullName.toLowerCase().includes(q) ||
          s.rollNumber.toLowerCase().includes(q) ||
          s.user?.email.toLowerCase().includes(q)
      );
    }

    const total = students.length;
    const startIndex = (page - 1) * limit;
    const paginated = students.slice(startIndex, startIndex + limit);

    return {
      students: paginated.map(s => ({
        id: s.id,
        name: s.fullName,
        fullName: s.fullName,
        email: s.user?.email,
        rollNumber: s.rollNumber,
        registrationNumber: s.registrationNumber,
        branch: s.branch,
        batch: s.batch,
        semester: s.semester,
        cgpa: s.cgpa,
        activeBacklogs: s.activeBacklogs,
        phone: s.phone,
        graduationYear: s.graduationYear,
        profileComplete: s.profileComplete,
        createdAt: s.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getCompanies() {
    const companies = await db.company.findMany({
      include: {
        user: true,
        jobDrives: true,
      },
    });

    return companies.map(c => ({
      id: c.id,
      name: c.companyName,
      companyName: c.companyName,
      companyEmail: c.companyEmail,
      industry: c.industry,
      website: c.website,
      description: c.description,
      verified: c.verified,
      activeDrivesCount: c.jobDrives?.filter(j => j.status === 'ACTIVE').length || 0,
      createdAt: c.createdAt,
    }));
  }

  static async verifyCompany(companyId, adminUserId, reqMeta = {}) {
    const company = await db.company.findUnique({ where: { id: companyId } });
    if (!company) {
      throw new Error('Company not found.');
    }

    const updated = await db.company.update({
      where: { id: companyId },
      data: { verified: true },
    });

    await AuditService.record({
      userId: adminUserId,
      action: 'COMPANY_VERIFIED',
      entityType: 'Company',
      entityId: companyId,
      metadata: { companyName: company.companyName },
      ipAddress: reqMeta.ipAddress,
      userAgent: reqMeta.userAgent,
    });

    return updated;
  }

  static async getAllApplications(query = {}) {
    const {
      jobId, branch, batch, status, search, page = 1, limit = 20,
      minCgpa, maxCgpa, maxBacklogs, minMatchScore, maxMatchScore,
    } = query;

    let apps = await db.application.findMany({
      where: status && status !== 'ALL' ? { status } : {},
      include: {
        job: { include: { company: true } },
        student: { include: { user: true } },
      },
    });

    if (jobId) {
      apps = apps.filter(a => a.jobId === jobId);
    }
    if (branch) {
      apps = apps.filter(a => a.student?.branch?.toUpperCase() === branch.toUpperCase());
    }
    if (batch) {
      apps = apps.filter(a => a.student?.batch === Number(batch));
    }
    if (minCgpa != null) apps = apps.filter(a => Number(a.student?.cgpa) >= minCgpa);
    if (maxCgpa != null) apps = apps.filter(a => Number(a.student?.cgpa) <= maxCgpa);
    if (maxBacklogs != null) apps = apps.filter(a => Number(a.student?.activeBacklogs) <= maxBacklogs);
    if (minMatchScore != null) apps = apps.filter(a => Number(a.matchScore || 0) >= minMatchScore);
    if (maxMatchScore != null) apps = apps.filter(a => Number(a.matchScore || 0) <= maxMatchScore);
    if (search) {
      const q = search.toLowerCase();
      apps = apps.filter(
        a =>
          a.student?.fullName?.toLowerCase().includes(q) ||
          a.student?.rollNumber?.includes(q) ||
          a.job?.title?.toLowerCase().includes(q) ||
          a.job?.company?.companyName?.toLowerCase().includes(q)
      );
    }

    const total = apps.length;
    const startIndex = (page - 1) * limit;
    const paginated = apps.slice(startIndex, startIndex + limit);

    return {
      applications: paginated.map(a => ({
        id: a.id,
        studentId: a.studentId,
        studentName: a.student?.fullName,
        rollNumber: a.student?.rollNumber,
        branch: a.student?.branch,
        cgpa: a.student?.cgpa,
        activeBacklogs: a.student?.activeBacklogs,
        phone: a.student?.phone,
        email: a.student?.user?.email,
        jobId: a.jobId,
        jobTitle: a.job?.title,
        companyName: a.job?.company?.companyName,
        status: a.status,
        matchScore: a.matchScore,
        appliedAt: a.appliedAt,
        shortlistedAt: a.shortlistedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Streams CSV output directly to response stream (Requirement #49)
   */
  static async streamApplicationsCsv(res, filters = {}, adminUserId, reqMeta = {}) {
    const {
      jobId, branch, batch, status, minCgpa, maxCgpa, maxBacklogs, minMatchScore, maxMatchScore,
    } = filters;

    let apps = await db.application.findMany({
      where: status && status !== 'ALL' ? { status } : {},
      include: {
        job: { include: { company: true } },
        student: { include: { user: true } },
      },
    });

    if (jobId) apps = apps.filter(a => a.jobId === jobId);
    if (branch) apps = apps.filter(a => a.student?.branch?.toUpperCase() === branch.toUpperCase());
    if (batch) apps = apps.filter(a => a.student?.batch === Number(batch));
    if (minCgpa != null) apps = apps.filter(a => Number(a.student?.cgpa) >= minCgpa);
    if (maxCgpa != null) apps = apps.filter(a => Number(a.student?.cgpa) <= maxCgpa);
    if (maxBacklogs != null) apps = apps.filter(a => Number(a.student?.activeBacklogs) <= maxBacklogs);
    if (minMatchScore != null) apps = apps.filter(a => Number(a.matchScore || 0) >= minMatchScore);
    if (maxMatchScore != null) apps = apps.filter(a => Number(a.matchScore || 0) <= maxMatchScore);

    // Headers
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="dcrust_placement_applications_${Date.now()}.csv"`
    );

    const stringifier = stringify({
      header: true,
      columns: [
        { key: 'applicationId', header: 'Application ID' },
        { key: 'studentName', header: 'Student Name' },
        { key: 'rollNumber', header: 'Roll Number' },
        { key: 'branch', header: 'Branch' },
        { key: 'cgpa', header: 'CGPA' },
        { key: 'backlogs', header: 'Active Backlogs' },
        { key: 'email', header: 'Email' },
        { key: 'phone', header: 'Phone' },
        { key: 'company', header: 'Company' },
        { key: 'jobTitle', header: 'Job Title' },
        { key: 'status', header: 'Application Status' },
        { key: 'matchScore', header: 'Resume Match Score (%)' },
        { key: 'appliedAt', header: 'Applied At' },
      ],
    });

    stringifier.pipe(res);

    for (const a of apps) {
      const row = {
        applicationId: a.id,
        studentName: a.student?.fullName || '',
        rollNumber: a.student?.rollNumber || '',
        branch: a.student?.branch || '',
        cgpa: a.student?.cgpa || 0,
        backlogs: a.student?.activeBacklogs || 0,
        email: a.student?.user?.email || '',
        phone: a.student?.phone || '',
        company: a.job?.company?.companyName || '',
        jobTitle: a.job?.title || '',
        status: a.status,
        matchScore: a.matchScore ?? 'N/A',
        appliedAt: a.appliedAt ? new Date(a.appliedAt).toISOString() : '',
      };
      for (const [key, value] of Object.entries(row)) {
        if (typeof value === 'string' && /^[\s]*[=+\-@]/.test(value)) {
          row[key] = `'${value}`;
        }
      }
      stringifier.write(row);
    }

    stringifier.end();

    // Record audit log
    await AuditService.record({
      userId: adminUserId,
      action: 'CSV_EXPORTED',
      entityType: 'Application',
      metadata: { filterCount: apps.length, filters },
      ipAddress: reqMeta.ipAddress,
      userAgent: reqMeta.userAgent,
    });
  }
}

export default AdminService;
