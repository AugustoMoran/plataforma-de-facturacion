import express from 'express';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import csurf from 'csurf';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import morgan from 'morgan';
import path from 'path';
import { isAllowedOrigin, parseAllowedOrigins } from './config/corsOrigins';

dotenv.config();

const app = express();
const allowedOrigins = parseAllowedOrigins();

if (process.env.NODE_ENV === 'production' && allowedOrigins.length) {
  console.log('CORS allowed origins:', allowedOrigins.join(', '));
}

app.use(helmet({
  crossOriginResourcePolicy: false,
}));
app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin, allowedOrigins)) {
      callback(null, true);
      return;
    }
    callback(null, false);
  },
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use(limiter);

// CSRF disabled for development/troubleshooting
// if (process.env.NODE_ENV !== 'test') {
//   app.use(csurf({ cookie: { httpOnly: true, sameSite: 'strict' } }));
// }

// basic health
app.get('/health', (req: any, res: any) => res.json({ ok: true }));

// mount modules
import authRoutes from './modules/auth/routes/authRoutes';
import inventoryRoutes from './modules/inventory/routes/inventoryRoutes';
import salesRoutes from './modules/sales/routes/salesRoutes';
import branchRoutes from './modules/branches/routes/branchRoutes';
import stockRoutes from './modules/stock/routes/stockRoutes';
import categoryRoutes from './modules/categories/routes/categoryRoutes';
import supplierRoutes from './modules/suppliers/routes/supplierRoutes';
import expenseRoutes from './modules/expenses/routes/expenseRoutes';
import supplierLedgerRoutes from './modules/supplierLedger/routes/supplierLedgerRoutes';
import afipRoutes from './modules/afip/routes/afipRoutes';
import settingsRoutes from './modules/settings/routes/settingsRoutes';
import ecommerceRoutes from './modules/ecommerce/routes/ecommerceRoutes';
import analyticsRoutes from './modules/analytics/routes/analyticsRoutes';
import paymentsRoutes from './modules/payments/routes/paymentsRoutes';
import shippingRoutes from './modules/shipping/routes/shippingRoutes';

app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/supplier-ledger', supplierLedgerRoutes);
app.use('/api/afip', afipRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/ecommerce', ecommerceRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/shipping', shippingRoutes);

// Error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error('SERVER ERROR:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// io will be initialized when server starts
let io: any = null;

const PORT = process.env.PORT || 4000;

export async function start() {
  try {
    const mongo = process.env.MONGO_URI || 'mongodb://localhost:27017/facturacion';
    await mongoose.connect(mongo);
    const server = app.listen(PORT, () => console.log(`Server listening ${PORT}`));

    // Initialize Socket.IO
    const { Server } = await import('socket.io');
    io = new Server(server, {
      cors: {
        origin: (origin, callback) => {
          if (isAllowedOrigin(origin, allowedOrigins)) {
            callback(null, true);
            return;
          }
          callback(null, false);
        },
        credentials: true,
      },
    });

    // Initialize AFIP Workers only when explicitly enabled
    if (process.env.ENABLE_AFIP_QUEUE === 'true') {
      try {
        await import('./config/queues');
        console.log('AFIP Billing Worker initialized');
      } catch (queueErr: any) {
        console.warn('AFIP Billing Worker disabled (Redis unavailable):', queueErr?.message || queueErr);
      }
    } else {
      console.log('AFIP Billing Worker disabled (set ENABLE_AFIP_QUEUE=true to enable)');
    }

    // socket events placeholder
    io.on('connection', (socket: any) => {
      console.log('socket connected', socket.id);
      socket.on('ping', () => socket.emit('pong'));
    });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

export { app, io };
