import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import env from '../config/env.js';
import logger from '../config/logger.js';

let io = null;

export function initializeSocket(httpServer) {
  const configuredOrigins = env.CORS_ORIGIN.split(',').map(s => s.trim().replace(/\/$/, ''));
  const defaultOrigins = ['http://localhost:5173', 'http://localhost:3000', 'https://placement-dcrust.vercel.app'];
  const allowedOrigins = Array.from(new Set([...configuredOrigins, ...defaultOrigins]));

  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const cleanOrigin = origin.replace(/\/$/, '');
        if (allowedOrigins.includes(cleanOrigin) || cleanOrigin.endsWith('.vercel.app')) {
          return callback(null, true);
        }
        return callback(new Error(`Socket origin not allowed: ${origin}`));
      },
      credentials: true,
    },
  });

  // Socket Authentication Middleware
  io.use((socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie;
      let token = null;

      if (cookieHeader) {
        const parsedCookies = cookie.parse(cookieHeader);
        token = parsedCookies[env.COOKIE_NAME];
      }

      if (!token && socket.handshake.auth?.token) {
        token = socket.handshake.auth.token;
      }

      if (!token) {
        // Allow anonymous connection with warning, or reject
        logger.debug('Socket connection without auth token.');
        return next();
      }

      const decoded = jwt.verify(token, env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      logger.warn(`Socket auth error: ${err.message}`);
      next();
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
  emitNewApplicantToCompany,
};
