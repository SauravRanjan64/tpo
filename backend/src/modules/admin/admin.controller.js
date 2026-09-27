import AdminService from './admin.service.js';
import AnalyticsService from '../analytics/analytics.service.js';
import AuditService from '../audit/audit.service.js';
import JobService from '../jobs/job.service.js';
import ApiResponse from '../../utils/apiResponse.js';

export class AdminController {
  static async getStats(req, res, next) {
    try {
      const stats = await AnalyticsService.getPlacementAnalytics();
      return ApiResponse.success(res, 'Admin stats retrieved.', { stats });
    } catch (err) {
      next(err);
    }
  }

  static async getStudents(req, res, next) {
    try {
      const result = await AdminService.getStudents(req.query);
      return ApiResponse.success(res, 'Students retrieved.', { students: result.students }, 200, result.pagination);
    } catch (err) {
      next(err);
    }
  }

  static async getCompanies(req, res, next) {
    try {
      const companies = await AdminService.getCompanies();
      return ApiResponse.success(res, 'Companies retrieved.', { companies });
    } catch (err) {
      next(err);
    }
  }

  static async verifyCompany(req, res, next) {
    try {
      const reqMeta = {
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
      };
      const company = await AdminService.verifyCompany(req.params.id, req.user.id, reqMeta);
      return ApiResponse.success(res, 'Company verified successfully.', { company });
    } catch (err) {
      next(err);
    }
  }

  static async getJobs(req, res, next) {
    try {
      const result = await JobService.getJobs(req.query, req.user.role);
      return ApiResponse.success(res, 'Jobs retrieved.', { jobs: result.jobs }, 200, result.pagination);
    } catch (err) {
      next(err);
    }
  }

  static async createJob(req, res, next) {
    try {
      const reqMeta = {
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
      };
      const job = await JobService.createJob(req.body, req.user.id, reqMeta);
      return ApiResponse.success(res, 'Job drive created by Admin.', { job }, 201);
    } catch (err) {
      next(err);
    }
  }

  static async getApplications(req, res, next) {
    try {
      const result = await AdminService.getAllApplications(req.query);
      return ApiResponse.success(res, 'Applications retrieved.', { applications: result.applications }, 200, result.pagination);
    } catch (err) {
      next(err);
    }
  }

  static async exportCsv(req, res, next) {
    try {
      const reqMeta = {
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
      };
      await AdminService.streamApplicationsCsv(res, req.query, req.user.id, reqMeta);
    } catch (err) {
      next(err);
    }
  }

  static async getAuditLogs(req, res, next) {
    try {
      const logs = await AuditService.getLogs(req.query);
      return ApiResponse.success(res, 'Audit logs retrieved.', { auditLogs: logs });
    } catch (err) {
      next(err);
    }
  }
}

export default AdminController;
