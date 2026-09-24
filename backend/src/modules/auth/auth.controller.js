import AuthService from './auth.service.js';
import ApiResponse from '../../utils/apiResponse.js';
import ERROR_CODES from '../../utils/errorCodes.js';
import env from '../../config/env.js';

export class AuthController {
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const reqMeta = {
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
      };

      const result = await AuthService.login(email, password, reqMeta);

      if (!result.success) {
        return ApiResponse.error(
          res,
          result.message,
          ERROR_CODES.AUTH_INVALID_CREDENTIALS,
          401
        );
      }

      // Set HttpOnly cookie
      res.cookie(env.COOKIE_NAME, result.token, AuthService.getCookieOptions());

      return ApiResponse.success(
        res,
        'Authentication successful.',
        {
          user: result.user,
          token: result.token,
        },
        200
      );
    } catch (err) {
      next(err);
    }
  }

  static async logout(req, res, next) {
    try {
      res.clearCookie(env.COOKIE_NAME, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/',
      });

      return ApiResponse.success(res, 'Logged out successfully.', {});
    } catch (err) {
      next(err);
    }
  }

  static async getMe(req, res, next) {
    try {
      const user = await AuthService.getMe(req.user.id);
      if (!user) {
        return ApiResponse.error(
          res,
          'User session is invalid.',
          ERROR_CODES.AUTH_UNAUTHORIZED,
          401
        );
      }
      return ApiResponse.success(res, 'Session profile retrieved.', { user });
    } catch (err) {
      next(err);
    }
  }

  static async refresh(req, res, next) {
    try {
      const user = await AuthService.getMe(req.user.id);
      const token = AuthService.generateToken(user);
      res.cookie(env.COOKIE_NAME, token, AuthService.getCookieOptions());

      return ApiResponse.success(res, 'Session refreshed successfully.', { user, token });
    } catch (err) {
      next(err);
    }
  }

  static async recordConsent(req, res, next) {
    try {
      const studentId = req.user.studentId;
      if (!studentId) {
        return ApiResponse.error(
          res,
          'Only student accounts can provide placement policy consent.',
          ERROR_CODES.AUTH_FORBIDDEN,
          403
        );
      }

      const { agreed = true, version = 'V2' } = req.body;
      const reqMeta = {
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
      };

      const consent = await AuthService.recordConsent(studentId, agreed, version, reqMeta);

      return ApiResponse.success(res, 'Consent recorded successfully.', { consent });
    } catch (err) {
      next(err);
    }
  }
}

export default AuthController;
