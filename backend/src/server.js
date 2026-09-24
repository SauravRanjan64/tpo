import http from 'http';
import { createApp } from './app.js';
import { initializeSocket } from './socket/socket.server.js';
import env from './config/env.js';
import logger from './config/logger.js';

const app = createApp();
const server = http.createServer(app);

// Initialize Socket.IO real-time engine
initializeSocket(server);

// Start HTTP Server
server.listen(env.PORT, () => {
  logger.info(`DCRUST Placement Backend V2 running in ${env.NODE_ENV} mode on port ${env.PORT}`);
  logger.info(`Swagger Documentation available at: http://localhost:${env.PORT}/docs`);
  logger.info(`Health check available at: http://localhost:${env.PORT}/api/health`);

  // Self-ping to prevent Render free-tier sleep
  if (env.NODE_ENV === 'production') {
    const backendUrl = process.env.RENDER_EXTERNAL_URL || 'https://placement-dcrust.onrender.com';
    setInterval(() => {
      fetch(`${backendUrl}/api/health`)
        .then(() => logger.debug('Keep-alive ping sent.'))
        .catch((err) => logger.warn(`Keep-alive ping failed: ${err.message}`));
    }, 4 * 60 * 1000);
  }
});

// Graceful Shutdown
function shutdown(signal) {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });

  // Force close after 10s if connections linger
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default server;
