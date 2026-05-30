import http from 'http';

import { config } from './config/env';
import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';
import { logger } from './config/logger';
import { createApp } from './app';
import { initSocketServer } from './sockets/socket.server';
import { createAfipWorker } from './queues/afip.worker';

async function bootstrap(): Promise<void> {
  try {
    // Connect to MongoDB
    await connectDatabase(config.mongodb.uri);

    // Connect to Redis
    await connectRedis();

    // Create Express app
    const app = createApp();

    // Create HTTP server
    const httpServer = http.createServer(app);

    // Initialize Socket.IO
    initSocketServer(httpServer);

    // Start AFIP worker
    if (config.env !== 'test') {
      createAfipWorker();
      logger.info('[Worker] AFIP worker started');
    }

    // Start listening
    httpServer.listen(config.port, config.host, () => {
      logger.info(`🚀 Server running at http://${config.host}:${config.port}`);
      logger.info(`   Environment: ${config.env}`);
      logger.info(`   API: http://${config.host}:${config.port}/api`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string): Promise<void> => {
      logger.info(`[${signal}] Starting graceful shutdown...`);

      httpServer.close(async () => {
        logger.info('HTTP server closed');

        const { disconnectDatabase } = await import('./config/database');
        const { disconnectRedis } = await import('./config/redis');

        await disconnectDatabase();
        await disconnectRedis();

        logger.info('Graceful shutdown completed');
        process.exit(0);
      });

      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled Promise Rejection:', reason);
    });

    process.on('uncaughtException', (err) => {
      logger.error('Uncaught Exception:', err);
      process.exit(1);
    });
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
}

bootstrap();
