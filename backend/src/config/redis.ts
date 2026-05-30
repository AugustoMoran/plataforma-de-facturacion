import IORedis from 'ioredis';

import { config } from './env';
import { logger } from './logger';

let redisClient: IORedis | null = null;

export function getRedisClient(): IORedis {
  if (!redisClient) {
    redisClient = new IORedis(config.redis.url, {
      maxRetriesPerRequest: null,
      lazyConnect: true,
    });

    redisClient.on('connect', () => logger.info('Redis connected'));
    redisClient.on('error', (err) => logger.error('Redis error:', err));
    redisClient.on('close', () => logger.warn('Redis connection closed'));
  }
  return redisClient;
}

/**
 * Returns plain connection options for BullMQ.
 * BullMQ bundles its own ioredis version, so passing a Redis instance
 * causes a type mismatch. Passing plain options avoids the conflict.
 */
export function getBullMQConnection(): { host: string; port: number; password?: string } {
  const url = new URL(config.redis.url);
  return {
    host: url.hostname,
    port: parseInt(url.port || '6379', 10),
    ...(url.password ? { password: decodeURIComponent(url.password) } : {}),
  };
}

export async function connectRedis(): Promise<void> {
  const client = getRedisClient();
  await client.connect();
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}
