import JobService from './job.service.js';
import ApiResponse from '../../utils/apiResponse.js';
import ERROR_CODES from '../../utils/errorCodes.js';

export class JobController {
  static async getJobs(req, res, next) {
    try {
      const result = await JobService.getJobs(req.query);
      return ApiResponse.success(res, 'Job drives retrieved.', { jobs: result.jobs }, 200, result.pagination);
    } catch (err) {
      next(err);
    }
  }

  static async getJobById(req, res, next) {
    try {
      const job = await JobService.getJobById(req.params.id);
      if (!job) {
        return ApiResponse.error(res, 'Job drive not found.', ERROR_CODES.JOB_NOT_FOUND, 404);
      }
      return ApiResponse.success(res, 'Job drive details retrieved.', { job });
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

      const job = await JobService.createJob(req.body, req.user.id, reqMeta, req.user.role);
      return ApiResponse.success(res, 'Job drive created successfully.', { job }, 201);
    } catch (err) {
      next(err);
    }
  }

  static async updateJob(req, res, next) {
    try {
      const reqMeta = {
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
      };

      const job = await JobService.updateJob(req.params.id, req.body, req.user.id, reqMeta, req.user.role);
      return ApiResponse.success(res, 'Job drive updated successfully.', { job });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Check eligibility for a specific job drive (Requirement #30)
   */
  static async checkEligibility(req, res, next) {
    try {
      const { found, result } = await JobService.checkJobEligibility(req.params.jobId, req.user.id);
      if (!found) {
        return ApiResponse.error(res, 'Job drive not found.', ERROR_CODES.JOB_NOT_FOUND, 404);
      }
      return ApiResponse.success(res, 'Eligibility evaluated.', result);
    } catch (err) {
      next(err);
    }
  }
}

export default JobController;
