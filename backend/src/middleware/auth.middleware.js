import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import ApiResponse from '../utils/apiResponse.js';
import ERROR_CODES from '../utils/errorCodes.js';
import { db } from '../config/database.js';

/**
 * Authentication middleware
 * Reads HttpOnly cookie, verifies JWT, loads user, attaches req.user
 */
export async function authenticate(req, res, next) {
  try {
    const token = req.cookies?.[env.COOKIE_NAME];

    if (!token) {
      return ApiResponse.error(
        res,
        'Authentication required. Please log in.',
        ERROR_CODES.AUTH_UNAUTHORIZED,
        401
      );
    }

    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET);
    } catch (err) {
      return ApiResponse.error(
        res,
        'Invalid or expired session token.',
        ERROR_CODES.AUTH_UNAUTHORIZED,
        401
      );
    }

    if (!decoded || !decoded.id) {
      return ApiResponse.error(
        res,
        'Invalid token payload.',
        ERROR_CODES.AUTH_UNAUTHORIZED,
        401
      );
    }

    // Load user from database to ensure active status
    const user = await db.user.findUnique({
      where: { id: decoded.id },
      include: {
        student: true,
        company: true,
      },
    });

    if (!user || !user.isActive) {
      return ApiResponse.error(
        res,
        'User account is not found or deactivated.',
        ERROR_CODES.AUTH_UNAUTHORIZED,
        401
      );
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      studentId: user.student?.id || null,
      companyId: user.company?.id || null,
      student: user.student || null,
      company: user.company || null,
    };

    next();
  } catch (error) {
    return next(error);
  }
}

export default authenticate;
