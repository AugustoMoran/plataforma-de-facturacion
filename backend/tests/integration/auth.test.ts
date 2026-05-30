import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';

import { createApp } from '../../src/app';
import { Role } from '../../src/database/models/role.model';
import { User } from '../../src/database/models/user.model';

let mongod: MongoMemoryServer;
const app = createApp();

const ADMIN_PERMISSIONS = {
  viewProducts: true, createProducts: true, editProducts: true, deleteProducts: true,
  viewStock: true, adjustStock: true, transferStock: true,
  viewSales: true, createSales: true, cancelSales: true, refundSales: true,
  viewUsers: true, createUsers: true, editUsers: true, deleteUsers: true,
  viewBranches: true, manageBranches: true,
  viewReports: true, exportReports: true,
  manageAfip: true, manageRoles: true, managePermissions: true, manageCategories: true,
};

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  await Promise.all([
    mongoose.connection.collection('users').deleteMany({}),
    mongoose.connection.collection('roles').deleteMany({}),
    mongoose.connection.collection('refreshtokens').deleteMany({}),
  ]);
});

describe('Auth Routes', () => {
  let adminRole: any;
  let testUser: any;

  beforeEach(async () => {
    adminRole = await Role.create({
      name: 'admin',
      displayName: 'Administrator',
      permissions: ADMIN_PERMISSIONS,
      isSystem: true,
    });

    testUser = await User.create({
      email: 'test@example.com',
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User',
      roleId: adminRole._id,
      isActive: true,
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'TestPassword123!' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('test@example.com');
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should fail with invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'WrongPassword!' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should fail with non-existent user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'notfound@example.com', password: 'Password123!' });

      expect(res.status).toBe(401);
    });

    it('should fail with invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'not-an-email', password: 'Password123!' });

      expect(res.status).toBe(422);
    });

    it('should fail with missing password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com' });

      expect(res.status).toBe(422);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user when authenticated', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'TestPassword123!' });

      const cookies = loginRes.headers['set-cookie'] as string[];
      const accessTokenCookie = cookies?.find((c: string) => c.startsWith('accessToken='));

      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', accessTokenCookie ? [accessTokenCookie] : []);

      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe('test@example.com');
    });

    it('should fail without authentication', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'TestPassword123!' });

      const cookies = loginRes.headers['set-cookie'] as string[];

      const res = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', cookies);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});

describe('Health Check', () => {
  it('should return 200 on /health', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
