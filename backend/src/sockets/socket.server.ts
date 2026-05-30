import http from 'http';

import jwt from 'jsonwebtoken';
import { Server, Socket } from 'socket.io';

import { config } from '../config/env';
import { logger } from '../config/logger';
import type { AuthTokenPayload } from '../shared/types';

let io: Server | null = null;

export function initSocketServer(httpServer: http.Server): Server {
  io = new Server(httpServer, {
    cors: {
      origin: config.cors.origins,
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Authentication middleware
  io.use((socket: Socket, next) => {
    try {
      const token =
        socket.handshake.auth?.['token'] ??
        socket.handshake.headers['cookie']
          ?.split(';')
          .find((c) => c.trim().startsWith('accessToken='))
          ?.split('=')[1];

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const payload = jwt.verify(token, config.jwt.accessSecret) as AuthTokenPayload;
      socket.data['user'] = payload;
      next();
    } catch {
      next(new Error('Invalid authentication token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data['user'] as AuthTokenPayload;
    logger.info(`[Socket] Client connected: ${user.userId} (${user.role})`);

    // Join user-specific room
    socket.join(`user:${user.userId}`);

    // Join branch room if applicable
    if (user.branchId) {
      socket.join(`branch:${user.branchId}`);
    }

    // Admins join all branches room
    if (user.role === 'admin') {
      socket.join('admin');
    }

    socket.on('join:branch', (branchId: string) => {
      socket.join(`branch:${branchId}`);
      logger.debug(`[Socket] User ${user.userId} joined branch: ${branchId}`);
    });

    socket.on('leave:branch', (branchId: string) => {
      socket.leave(`branch:${branchId}`);
    });

    socket.on('disconnect', (reason) => {
      logger.info(`[Socket] Client disconnected: ${user.userId}, reason: ${reason}`);
    });

    socket.on('error', (err) => {
      logger.error(`[Socket] Error for user ${user.userId}:`, err);
    });
  });

  logger.info('[Socket] Socket.IO server initialized');
  return io;
}

export function getSocketServer(): Server | null {
  return io;
}
