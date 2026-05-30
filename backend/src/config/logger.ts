import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

import { config } from './env';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp: ts, stack, ...meta }) => {
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `${ts} [${level}]: ${stack ?? message}${metaStr}`;
});

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: combine(colorize(), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true }), logFormat),
  }),
];

if (config.env === 'production') {
  transports.push(
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxFiles: '30d',
      format: combine(timestamp(), errors({ stack: true }), logFormat),
    }),
    new DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '14d',
      format: combine(timestamp(), errors({ stack: true }), logFormat),
    }),
  );
}

export const logger = winston.createLogger({
  level: config.logging.level,
  transports,
  exitOnError: false,
});
