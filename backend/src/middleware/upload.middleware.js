import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';
import env from '../config/env.js';
import ApiResponse from '../utils/apiResponse.js';
import ERROR_CODES from '../utils/errorCodes.js';
import { extractResumeText } from '../modules/resumes/resumeExtractor.service.js';

// Ensure upload directory exists
const uploadDir = path.resolve(env.STORAGE_UPLOAD_DIR);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration with sanitized UUID key
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const studentId = req.user?.studentId || 'unknown';
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueKey = `${studentId}-${randomUUID()}${ext}`;
    cb(null, uniqueKey);
  },
});

// File filter: only PDF and DOCX under 5MB
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  const allowedExtensions = ['.pdf', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('INVALID_FILE_TYPE'));
  }
};

export const uploadResumeFile = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter,
}).single('resume');

export function handleResumeUpload(req, res, next) {
  uploadResumeFile(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return ApiResponse.error(res, 'File size exceeds maximum allowed limit of 5MB.', ERROR_CODES.FILE_TOO_LARGE, 400);
      }
      return ApiResponse.error(res, `Upload error: ${err.message}`, ERROR_CODES.RESUME_INVALID, 400);
    } else if (err) {
      if (err.message === 'INVALID_FILE_TYPE') {
        return ApiResponse.error(res, 'Only PDF and DOCX resumes are allowed.', ERROR_CODES.RESUME_INVALID, 400);
      }
      return ApiResponse.error(res, err.message, ERROR_CODES.RESUME_INVALID, 400);
    }
    if (!req.file) return next();

    fs.promises.open(req.file.path, 'r').then(async (file) => {
      const signature = Buffer.alloc(8);
      const { bytesRead } = await file.read(signature, 0, signature.length, 0);
      await file.close();

      const extension = path.extname(req.file.originalname).toLowerCase();
      const validPdf = extension === '.pdf'
        && req.file.mimetype === 'application/pdf'
        && signature.subarray(0, 5).toString() === '%PDF-';
      const validDocx = extension === '.docx'
        && req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        && bytesRead >= 4
        && signature[0] === 0x50
        && signature[1] === 0x4b
        && signature[2] === 0x03
        && signature[3] === 0x04;

      if (!validPdf && !validDocx) {
        await fs.promises.unlink(req.file.path);
        return ApiResponse.error(
          res,
          'The uploaded file content does not match a supported PDF or DOCX resume.',
          ERROR_CODES.RESUME_INVALID,
          400
        );
      }
      return extractResumeText(req.file.filename, req.file.mimetype)
        .then(() => next())
        .catch(async () => {
          await fs.promises.unlink(req.file.path);
          return ApiResponse.error(
            res,
            'The uploaded document is invalid or its text cannot be read.',
            ERROR_CODES.RESUME_INVALID,
            400
          );
        });
    }).catch(next);
  });
}

export default handleResumeUpload;
