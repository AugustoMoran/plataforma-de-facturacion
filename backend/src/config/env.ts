import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

export const config = {
  env: process.env['NODE_ENV'] ?? 'development',
  port: parseInt(process.env['PORT'] ?? '3000', 10),
  host: process.env['HOST'] ?? '0.0.0.0',

  mongodb: {
    uri: process.env['MONGODB_URI']!,
  },

  redis: {
    url: process.env['REDIS_URL'] ?? 'redis://localhost:6379',
  },

  jwt: {
    accessSecret: process.env['JWT_ACCESS_SECRET']!,
    refreshSecret: process.env['JWT_REFRESH_SECRET']!,
    accessExpiry: process.env['JWT_ACCESS_EXPIRY'] ?? '15m',
    refreshExpiry: process.env['JWT_REFRESH_EXPIRY'] ?? '7d',
  },

  cloudinary: {
    cloudName: process.env['CLOUDINARY_CLOUD_NAME'] ?? '',
    apiKey: process.env['CLOUDINARY_API_KEY'] ?? '',
    apiSecret: process.env['CLOUDINARY_API_SECRET'] ?? '',
  },

  afip: {
    cuit: process.env['AFIP_CUIT'] ?? '',
    certPath: process.env['AFIP_CERT_PATH'] ?? './certs/afip.crt',
    keyPath: process.env['AFIP_KEY_PATH'] ?? './certs/afip.key',
    environment: (process.env['AFIP_ENV'] ?? 'homologacion') as 'homologacion' | 'produccion',
  },

  cors: {
    frontendUrl: process.env['FRONTEND_URL'] ?? 'http://localhost:5173',
    origins: (process.env['CORS_ORIGINS'] ?? 'http://localhost:5173').split(','),
  },

  rateLimit: {
    windowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] ?? '900000', 10),
    max: parseInt(process.env['RATE_LIMIT_MAX'] ?? '100', 10),
  },

  logging: {
    level: process.env['LOG_LEVEL'] ?? 'info',
  },
} as const;
