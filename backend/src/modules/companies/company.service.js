import { db } from '../../config/database.js';
import AuditService from '../audit/audit.service.js';

export class CompanyService {
  static async getProfileByUserId(userId) {
    return await db.company.findUnique({
      where: { userId },
      include: {
        user: true,
        jobDrives: true,
      },
    });
  }

  static async updateProfile(userId, updateData, reqMeta = {}) {
    const company = await db.company.findUnique({ where: { userId } });
    if (!company) {
      throw new Error('Company not found.');
    }

    const updated = await db.company.update({
      where: { id: company.id },
      data: updateData,
    });

    await AuditService.record({
      userId,
      action: 'COMPANY_PROFILE_UPDATED',
      entityType: 'Company',
      entityId: company.id,
      metadata: updateData,
      ipAddress: reqMeta.ipAddress,
      userAgent: reqMeta.userAgent,
    });

    return updated;
  }

  static async getCompanyStats(companyUserId) {
    const company = await db.company.findUnique({ where: { userId: companyUserId } });
    if (!company) {
      throw new Error('Company not found.');
    }

    const drives = await db.jobDrive.findMany({
      where: { companyId: company.id },
      include: { applications: true },
    });

    const activeDrives = drives.filter(d => d.status === 'ACTIVE').length;

    let totalApplicants = 0;
    let shortlisted = 0;
    let selected = 0;
    let rejected = 0;

    drives.forEach(drive => {
      drive.applications?.forEach(app => {
        totalApplicants++;
        if (app.status === 'SHORTLISTED') shortlisted++;
        if (app.status === 'SELECTED') selected++;
        if (app.status === 'REJECTED') rejected++;
      });
    });

    return {
      activeDrives,
      totalDrives: drives.length,
      totalApplicants,
      shortlisted,
      selected,
      rejected,
      companyName: company.companyName,
      verified: company.verified,
    };
  }

  static async getCompanyDrives(companyUserId) {
    const company = await db.company.findUnique({ where: { userId: companyUserId } });
    if (!company) {
      throw new Error('Company not found.');
    }

    const drives = await db.jobDrive.findMany({
      where: { companyId: company.id },
      include: {
        branches: true,
        skills: true,
        applications: true,
      },
    });

    return drives.map(d => ({
      id: d.id,
      title: d.title,
      description: d.description,
      location: d.location,
      salaryMin: d.salaryMin,
      salaryMax: d.salaryMax,
      salaryRange: `${(d.salaryMin / 100000).toFixed(1)}–${(d.salaryMax / 100000).toFixed(1)} LPA`,
      minCgpa: d.minCgpa,
      maxBacklogs: d.maxBacklogs,
      eligibleBatches: d.eligibleBatches || [],
      applicationStart: d.applicationStart,
      applicationEnd: d.applicationEnd,
      status: d.status,
      branches: d.branches?.map(b => b.branch),
      allowedBranches: d.branches?.map(b => b.branch),
      skills: d.skills?.map(s => s.skill),
      totalApplicants: d.applications?.length || 0,
    }));
  }
}

export default CompanyService;
