import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import jwt from 'jsonwebtoken';

import { createApp } from '../../src/app';
import { Category } from '../../src/database/models/category.model';
import { Product } from '../../src/database/models/product.model';
import { Role } from '../../src/database/models/role.model';
import { User } from '../../src/database/models/user.model';

let mongod: MongoMemoryServer;
const app = createApp();

const FULL_PERMISSIONS = {
  viewProducts: true, createProducts: true, editProducts: true, deleteProducts: true,
  viewStock: true, adjustStock: true, transferStock: true,
  viewSales: true, createSales: true, cancelSales: true, refundSales: true,
  viewUsers: true, createUsers: true, editUsers: true, deleteUsers: true,
  viewBranches: true, manageBranches: true,
  viewReports: true, exportReports: true,
  manageAfip: true, manageRoles: true, managePermissions: true, manageCategories: true,
};

let adminAccessToken: string;
let categoryId: string;
let adminUserId: string;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  const role = await Role.create({
    name: 'admin', displayName: 'Admin',
    permissions: FULL_PERMISSIONS, isSystem: true,
  });

  const user = await User.create({
    email: 'admin@test.com', password: 'Admin123!',
    firstName: 'Admin', lastName: 'Test',
    roleId: role._id, isActive: true,
  });
  adminUserId = user._id.toString();

  adminAccessToken = jwt.sign(
    {
      userId: adminUserId,
      email: 'admin@test.com',
      role: 'admin',
      permissions: FULL_PERMISSIONS,
    },
    process.env['JWT_ACCESS_SECRET']!,
    { expiresIn: '15m' },
  );

  const category = await Category.create({ name: 'Electronics' });
  categoryId = category._id.toString();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  await Product.deleteMany({});
});

describe('Products Routes', () => {
  describe('GET /api/products', () => {
    it('should return paginated products', async () => {
      await Product.create([
        { name: 'Product 1', categoryId, cost: 100, ivaPercentage: 21, profitPercentage: 30, publicPrice: 157.30, createdBy: adminUserId },
        { name: 'Product 2', categoryId, cost: 200, ivaPercentage: 21, profitPercentage: 20, publicPrice: 290.40, createdBy: adminUserId },
      ]);

      const res = await request(app)
        .get('/api/products')
        .set('Cookie', [`accessToken=${adminAccessToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.pagination.total).toBe(2);
    });

    it('should filter by search term', async () => {
      await Product.create([
        { name: 'Laptop', categoryId, cost: 500, ivaPercentage: 21, profitPercentage: 20, publicPrice: 726, createdBy: adminUserId },
        { name: 'Mouse', categoryId, cost: 20, ivaPercentage: 21, profitPercentage: 50, publicPrice: 36.30, createdBy: adminUserId },
      ]);

      const res = await request(app)
        .get('/api/products?search=laptop')
        .set('Cookie', [`accessToken=${adminAccessToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe('Laptop');
    });
  });

  describe('POST /api/products/calculate-price', () => {
    it('should calculate public price from profit percentage', async () => {
      const res = await request(app)
        .post('/api/products/calculate-price')
        .set('Cookie', [`accessToken=${adminAccessToken}`])
        .send({ cost: 100, ivaPercentage: 21, profitPercentage: 30 });

      expect(res.status).toBe(200);
      expect(res.body.data.publicPrice).toBe(157.30);
    });

    it('should calculate profit percentage from public price', async () => {
      const res = await request(app)
        .post('/api/products/calculate-price')
        .set('Cookie', [`accessToken=${adminAccessToken}`])
        .send({ cost: 100, ivaPercentage: 21, publicPrice: 157.30 });

      expect(res.status).toBe(200);
      expect(res.body.data.profitPercentage).toBeCloseTo(30, 1);
    });
  });

  describe('POST /api/products', () => {
    it('should require authentication', async () => {
      const res = await request(app)
        .post('/api/products')
        .send({ name: 'Test Product', categoryId, cost: 100, ivaPercentage: 21 });

      expect(res.status).toBe(401);
    });
  });
});
