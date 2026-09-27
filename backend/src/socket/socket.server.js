import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import env from '../config/env.js';
import logger from '../config/logger.js';
import { db } from '../config/database.js';

let io = null;

export function initializeSocket(httpServer) {
  const configuredOrigins = env.CORS_ORIGIN.split(',').map(s => s.trim().replace(/\/$/, ''));
  const allowedOrigins = Array.from(new Set(configuredOrigins));

  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const cleanOrigin = origin.replace(/\/$/, '');
        if (allowedOrigins.includes(cleanOrigin)) {
          return callback(null, true);
        }
        return callback(new Error(`Socket origin not allowed: ${origin}`));
      },
      credentials: true,
    },
  });

  // Socket Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie;
      let token = null;

      if (cookieHeader) {
        const parsedCookies = cookie.parse(cookieHeader);
        token = parsedCookies[env.COOKIE_NAME];
      }

      if (!token) {
        logger.warn('Unauthorized socket connection attempt (no token).');
        return next(new Error('Authentication error: Token required'));
      }

      const decoded = jwt.verify(token, env.JWT_SECRET);
      const user = await db.user.findUnique({
        where: { id: decoded.id },
        include: { company: true },
      });
      if (!user || !user.isActive) {
        return next(new Error('Authentication error: Account is unavailable'));
      }
      socket.user = {
        id: user.id,
        role: user.role,
        companyId: user.company?.id || null,
      };
      next();
    } catch (err) {
      logger.warn(`Socket auth error: ${err.message}`);
      next(new Error(`Authentication error: ${err.message}`));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.user;
    if (user && user.id) {
      // User joins user room
      socket.join(`user:${user.id}`);
      logger.debug(`User ${user.id} joined socket room user:${user.id}`);

      // Recruiter joins company room if applicable
      if (user.companyId) {
        socket.join(`company:${user.companyId}`);
        logger.debug(`Recruiter ${user.id} joined socket room company:${user.companyId}`);
      }
    }

    socket.on('disconnect', () => {
      logger.debug(`Socket client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO() {
  return io;
}

/**
 * Emits application status update to the student's room
 */
export function emitApplicationStatusUpdate(userId, payload) {
  if (io) {
    io.to(`user:${userId}`).emit('application:status-updated', payload);
    logger.debug(`Emitted application:status-updated to user:${userId}`);
  }
}

export function emitUserNotification(userId, notification) {
  if (io) io.to(`user:${userId}`).emit('notification:new', notification);
}

/**
 * Emits new application notification to company room
 */
export function emitNewApplicantToCompany(companyId, payload) {
  if (io && companyId) {
    io.to(`company:${companyId}`).emit('company:new-applicant', payload);
    logger.debug(`Emitted company:new-applicant to company:${companyId}`);
  }
}

export default {
  initializeSocket,
  getIO,
  emitApplicationStatusUpdate,
  emitUserNotification,
  emitNewApplicantToCompany,
};
