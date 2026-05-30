import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Application } from 'express';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import morgan from 'morgan';

import { config } from './config/env';
import { logger } from './config/logger';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { globalRateLimit } from './middleware/rate-limit.middleware';

// Routes
import authRoutes from './modules/auth/auth.routes';
import branchesRoutes from './modules/branches/branches.routes';
import categoriesRoutes from './modules/products/categories.routes';
import productsRoutes from './modules/products/products.routes';
import reportsRoutes from './modules/reports/reports.routes';
import rolesRoutes from './modules/roles/roles.routes';
import salesRoutes from './modules/sales/sales.routes';
import stockRoutes from './modules/stock/stock.routes';
import usersRoutes from './modules/users/users.routes';

export function createApp(): Application {
  const app = express();

  // Security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'res.cloudinary.com'],
          scriptSrc: ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );

  // CORS
  app.use(
    cors({
      origin: config.cors.origins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    }),
  );

  // Compression
  app.use(compression());

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Cookie parsing
  app.use(cookieParser());

  // MongoDB query injection sanitization
  app.use(mongoSanitize());

  // Rate limiting
  app.use(globalRateLimit);

  // HTTP request logging
  if (config.env !== 'test') {
    app.use(
      morgan('combined', {
        stream: { write: (msg) => logger.http(msg.trim()) },
      }),
    );
  }

  // Trust proxy (for accurate IP behind nginx)
  app.set('trust proxy', 1);

  // Health check
  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      env: config.env,
    });
  });

  // API routes
  const apiRouter = express.Router();
  apiRouter.use('/auth', authRoutes);
  apiRouter.use('/branches', branchesRoutes);
  apiRouter.use('/categories', categoriesRoutes);
  apiRouter.use('/products', productsRoutes);
  apiRouter.use('/reports', reportsRoutes);
  apiRouter.use('/roles', rolesRoutes);
  apiRouter.use('/sales', salesRoutes);
  apiRouter.use('/stock', stockRoutes);
  apiRouter.use('/users', usersRoutes);

  app.use('/api', apiRouter);

  // 404 handler
  app.use(notFoundHandler);

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}
