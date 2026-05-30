#!/usr/bin/env node

/**
 * MongoDB initialization script for production deployment.
 * Creates default indexes and initial admin user.
 * Run once after first deploy.
 */

db = db.getSiblingDB('facturacion_db');

// Create collections with validators
db.createCollection('users');
db.createCollection('roles');
db.createCollection('branches');
db.createCollection('products');
db.createCollection('stock');
db.createCollection('stockmovements');
db.createCollection('sales');
db.createCollection('refreshtokens');
db.createCollection('notifications');

// Indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ roleId: 1 });
db.users.createIndex({ branchId: 1 });

db.products.createIndex({ name: 'text', barcode: 'text', internalCode: 'text' });
db.products.createIndex({ categoryId: 1 });
db.products.createIndex({ barcode: 1 }, { sparse: true });

db.stock.createIndex({ productId: 1, branchId: 1 }, { unique: true });
db.stock.createIndex({ branchId: 1 });

db.stockmovements.createIndex({ productId: 1, branchId: 1 });
db.stockmovements.createIndex({ createdAt: -1 });
db.stockmovements.createIndex({ userId: 1 });

db.sales.createIndex({ branchId: 1, createdAt: -1 });
db.sales.createIndex({ sellerId: 1 });
db.sales.createIndex({ status: 1 });
db.sales.createIndex({ saleType: 1 });
db.sales.createIndex({ 'afip.status': 1 });

db.refreshtokens.createIndex({ token: 1 }, { unique: true });
db.refreshtokens.createIndex({ userId: 1 });
db.refreshtokens.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

db.notifications.createIndex({ userId: 1, isRead: 1 });
db.notifications.createIndex({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // 30 days

print('MongoDB initialization complete!');
print('Run the seed script to create default data: npm run seed');
