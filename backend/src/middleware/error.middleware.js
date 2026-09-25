import env from '../config/env.js';
import logger from '../config/logger.js';
import ApiResponse from '../utils/apiResponse.js';
import ERROR_CODES from '../utils/errorCodes.js';

export function errorHandler(err, req, res, next) {
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    userId: req.user?.id,
  }, 'Unhandled Application Error');

  // Handle specific known database error codes.
  if (err.code === 11000 || err.code === 'P2002') {
    // Unique constraint violation from MongoDB/Mongoose.
    return ApiResponse.error(
      res,
      'A record with this unique identifier already exists.',
      ERROR_CODES.APPLICATION_DUPLICATE,
      409
    );
  }

  if (err.status === 403) {
    return ApiResponse.error(res, err.message, ERROR_CODES.AUTH_FORBIDDEN, 403);
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return ApiResponse.error(
      res,
      'Invalid or expired authentication session.',
      ERROR_CODES.AUTH_UNAUTHORIZED,
      401
    );
  }

  // Safe message in production
  const isProduction = env.NODE_ENV === 'production';
  const responseMessage = isProduction
    ? 'An internal server error occurred. Please try again later.'
    : (err.message || 'Internal Server Error');

  return ApiResponse.error(
    res,
    responseMessage,
    err.errorCode || ERROR_CODES.INTERNAL_SERVER_ERROR,
    err.statusCode || 500,
    !isProduction && err.stack ? [err.stack] : []
  );
}

export function notFoundHandler(req, res) {
  return ApiResponse.error(
    res,
    `Route ${req.method} ${req.originalUrl} not found.`,
    ERROR_CODES.RESOURCE_NOT_FOUND,
    404
  );
}

export default {
  errorHandler,
  notFoundHandler,
};
