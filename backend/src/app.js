import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import env from './config/env.js';
import { httpLogger } from './config/logger.js';
import { globalLimiter } from './middleware/rateLimiter.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import { setupSwagger } from './config/swagger.js';
import routes from './routes/index.js';

export function createApp() {
  const app = express();
  app.set('trust proxy', 1);

  // 1. Security Headers
  app.use(helmet({
    contentSecurityPolicy: false, // Allows Swagger UI inline assets
    crossOriginEmbedderPolicy: false,
  }));

  // 2. CORS
  const configuredOrigins = env.CORS_ORIGIN.split(',').map(s => s.trim().replace(/\/$/, ''));
  const defaultOrigins = ['http://localhost:5173', 'http://localhost:3000', 'https://placement-dcrust.vercel.app'];
  const allowedOrigins = Array.from(new Set([...configuredOrigins, ...defaultOrigins]));

  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/$/, '');
      if (allowedOrigins.includes(cleanOrigin) || cleanOrigin.endsWith('.vercel.app')) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} is not allowed by CORS policy`));
    },
    credentials: true,
  }));

  // 3. Request Parsing & Cookies
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // 4. Structured Logging & Rate Limiting
  app.use(httpLogger);
  app.use('/api', globalLimiter);

  // 5. Swagger OpenAPI documentation
  setupSwagger(app);

  // 6. Mount API Routes
  app.use('/api', routes);

  // Root welcome & info
  app.get('/', (req, res) => {
    res.json({
      name: 'DCRUST Campus Placement & Eligibility Portal API',
      version: '2.0.0',
      docs: '/docs',
      health: '/api/health',
    });
  });

  // 7. Error Handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export default createApp;
