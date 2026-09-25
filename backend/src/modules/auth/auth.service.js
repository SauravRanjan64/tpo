import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import env from '../../config/env.js';
import { db } from '../../config/database.js';
import AuditService from '../audit/audit.service.js';

export class AuthService {
  /**
   * Generates JWT token for authenticated user
   */
  static generateToken(user) {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        studentId: user.student?.id || null,
        companyId: user.company?.id || null,
      },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );
  }

  /**
   * Generates standard HttpOnly cookie configuration
   */
  static getCookieOptions() {
    return {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    };
  }

  /**
   * Authenticates user via email and password
   */
  static async login(email, password, reqMeta = {}) {
    const user = await db.user.findUnique({
      where: { email },
      includePasswordHash: true,
      include: {
        student: true,
        company: true,
      },
    });

    if (!user || !user.isActive) {
      return { success: false, error: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' };
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return { success: false, error: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' };
    }

    // Update lastLoginAt
    await db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate JWT
    const token = this.generateToken(user);

    // Record audit log
    await AuditService.record({
      userId: user.id,
      action: 'LOGIN',
      entityType: 'User',
      entityId: user.id,
      metadata: { role: user.role, email: user.email },
      ipAddress: reqMeta.ipAddress,
      userAgent: reqMeta.userAgent,
    });

    // Check student consent status if student
    let consentGiven = true;
    if (user.role === 'STUDENT' && user.student) {
      const activeConsent = await db.consent.findFirst({
        where: { studentId: user.student.id, accepted: true },
      });
      consentGiven = Boolean(activeConsent);
    }

    // Never return passwordHash
    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      studentId: user.student?.id || null,
      companyId: user.company?.id || null,
      student: user.student || null,
      company: user.company || null,
      consentGiven,
    };

    return {
      success: true,
      user: safeUser,
      token,
    };
  }

  /**
   * Loads current user profile and session info
   */
  static async getMe(userId) {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        student: true,
        company: true,
      },
    });

    if (!user) return null;

    let consentGiven = true;
    if (user.role === 'STUDENT' && user.student) {
      const activeConsent = await db.consent.findFirst({
        where: { studentId: user.student.id, accepted: true },
      });
      consentGiven = Boolean(activeConsent);
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      studentId: user.student?.id || null,
      companyId: user.company?.id || null,
      student: user.student || null,
      company: user.company || null,
      consentGiven,
    };
  }

  /**
   * Records student consent with immutable history
   */
  static async recordConsent(studentId, agreed, version = 'V2', reqMeta = {}) {
    const student = await db.student.findUnique({ where: { id: studentId } });
    if (!student) {
      throw new Error('Student profile not found.');
    }

    const consent = await db.consent.create({
      data: {
        studentId,
        consentType: 'PLACEMENT_POLICY',
        version,
        accepted: agreed,
        acceptedAt: new Date(),
        withdrawnAt: agreed ? null : new Date(),
      },
    });

    // Record audit log
    await AuditService.record({
      userId: student.userId,
      action: agreed ? 'CONSENT_ACCEPTED' : 'CONSENT_WITHDRAWN',
      entityType: 'Consent',
      entityId: consent.id,
      metadata: { version, accepted: agreed },
      ipAddress: reqMeta.ipAddress,
      userAgent: reqMeta.userAgent,
    });

    return consent;
  }
}

export default AuthService;
