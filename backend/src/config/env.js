import dotenv from 'dotenv';
import { z } from 'zod';

const currentEnv = process.env.NODE_ENV;
dotenv.config();

// Ensure test environment is preserved when running under Jest
if (process.env.JEST_WORKER_ID !== undefined || currentEnv === 'test') {
  process.env.NODE_ENV = 'test';
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  MONGODB_URI: z.string().url().default('mongodb://localhost:27017/dcrust'),
  JWT_SECRET: z.string().default('super_secret_jwt_key_for_dcrust_placement_system_2026'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  COOKIE_NAME: z.string().default('dcrust_auth_token'),
  CORS_ORIGIN: z.string().default('http://localhost:5173,http://localhost:3000,https://placement-dcrust.vercel.app'),
  STORAGE_UPLOAD_DIR: z.string().default('./uploads'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
export default env;
