import ResumeService from './resume.service.js';
import ApiResponse from '../../utils/apiResponse.js';
import ERROR_CODES from '../../utils/errorCodes.js';
import path from 'node:path';

export class ResumeController {
  static async getResume(req, res, next) {
    try {
      const studentId = req.user.studentId;
      if (!studentId) {
        return ApiResponse.error(res, 'Student record not found.', ERROR_CODES.RESOURCE_NOT_FOUND, 404);
      }
      const resume = await ResumeService.getResumeByStudentId(studentId);
      return ApiResponse.success(res, 'Resume metadata retrieved.', { resume });
    } catch (err) {
      next(err);
    }
  }

  static async uploadResume(req, res, next) {
    try {
      const studentId = req.user.studentId;
      if (!studentId) {
        return ApiResponse.error(res, 'Student record not found.', ERROR_CODES.RESOURCE_NOT_FOUND, 404);
      }

      if (!req.file) {
        return ApiResponse.error(res, 'A resume file is required.', ERROR_CODES.RESUME_INVALID, 400);
      }

      const reqMeta = {
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
      };

      const resume = await ResumeService.saveUploadedResume(studentId, req.file, reqMeta);
      return ApiResponse.success(res, 'Resume uploaded successfully.', { resume }, 201);
    } catch (err) {
      next(err);
    }
  }

  static async deleteResume(req, res, next) {
    try {
      const studentId = req.user.studentId;
      if (!studentId) {
        return ApiResponse.error(res, 'Student record not found.', ERROR_CODES.RESOURCE_NOT_FOUND, 404);
      }

      const reqMeta = {
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
      };

      await ResumeService.deleteResume(studentId, reqMeta);
      return ApiResponse.success(res, 'Resume deleted successfully.', {});
    } catch (err) {
      next(err);
    }
  }

  static async matchResume(req, res, next) {
    try {
      const studentId = req.user.studentId;
      const { jobId } = req.body;

      if (!jobId) {
        return ApiResponse.error(res, 'Job ID is required for resume matching.', ERROR_CODES.VALIDATION_ERROR, 400);
      }

      const match = await ResumeService.matchResumeAgainstJob(studentId, jobId);
      return ApiResponse.success(res, 'Resume match calculated.', { match });
    } catch (err) {
      next(err);
    }
  }

  static async downloadResume(req, res, next) {
    try {
      const file = await ResumeService.getAuthorizedResumeFile(req.params.id, req.user);
      if (!file) {
        return ApiResponse.error(res, 'Resume not found.', ERROR_CODES.RESOURCE_NOT_FOUND, 404);
      }
      const fileName = path.basename(file.fileName);
      return res.download(file.filePath, fileName);
    } catch (err) {
      next(err);
    }
  }
}

export default ResumeController;
