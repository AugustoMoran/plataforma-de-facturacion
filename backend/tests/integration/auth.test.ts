import request from 'supertest';
import jwt from 'jsonwebtoken';

// ── Mock BullMQ & Redis before app loads ─────────────────────────────────────
jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: jest.fn().mockResolvedValue({}),
    close: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
  })),
  Worker: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    close: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock('ioredis', () =>
  jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    quit: jest.fn(),
  })),
);

// ── Mock Mongoose models ──────────────────────────────────────────────────────
const mockUser = {
  _id: '507f1f77bcf86cd799439011',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  isActive: true,
  isDeleted: false,
  roleId: {
    _id: '507f1f77bcf86cd799439012',
    name: 'admin',
    displayName: 'Administrator',
    permissions: {
      viewProducts: true, createProducts: true, editProducts: true, deleteProducts: true,
      viewStock: true, adjustStock: true, transferStock: true,
      viewSales: true, createSales: true, cancelSales: true, refundSales: true,
      viewUsers: true, createUsers: true, editUsers: true, deleteUsers: true,
      viewBranches: true, manageBranches: true,
      viewReports: true, exportReports: true,
      manageAfip: true, manageRoles: true, managePermissions: true, manageCategories: true,
    },
  },
  permissions: {},
  comparePassword: jest.fn(),
};

jest.mock('../../src/database/models/user.model', () => ({
  User: {
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
  },
}));

jest.mock('../../src/database/models/refresh-token.model', () => ({
  RefreshToken: {
    findOne: jest.fn(),
    create: jest.fn(),
    deleteOne: jest.fn(),
    deleteMany: jest.fn(),
    findOneAndUpdate: jest.fn(),
    updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
  },
}));

jest.mock('../../src/database/models/role.model', () => ({
  Role: {
    findOne: jest.fn(),
    findById: jest.fn(),
  },
}));

// ── Import app after mocks ────────────────────────────────────────────────────
import { createApp } from '../../src/app';
import { User } from '../../src/database/models/user.model';
import { RefreshToken } from '../../src/database/models/refresh-token.model';

const app = createApp();

// Helpers
const ACCESS_SECRET = process.env['JWT_ACCESS_SECRET']!;

function makeAccessToken(payload: object): string {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: '15m' });
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ── Health check ──────────────────────────────────────────────────────────────
describe('Health Check', () => {
  it('GET /health should return 200', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

// ── Auth Routes ───────────────────────────────────────────────────────────────
describe('Auth Routes', () => {
  describe('POST /api/auth/login', () => {
    it('should return 200 with valid credentials', async () => {
      const userWithSelect = { ...mockUser, comparePassword: jest.fn().mockResolvedValue(true) };
      (User.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockUser),
      });
      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(userWithSelect),
      });
      (RefreshToken.create as jest.Mock).mockResolvedValue({ token: 'refresh-token-value' });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'TestPassword123!' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('test@example.com');
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should return 401 with invalid password', async () => {
      const userWithSelect = { ...mockUser, comparePassword: jest.fn().mockResolvedValue(false) };
      (User.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockUser),
      });
      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(userWithSelect),
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'WrongPassword!' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 when user not found', async () => {
      (User.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(null),
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'notfound@example.com', password: 'Password123!' });

      expect(res.status).toBe(401);
    });

    it('should return 422 with invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'not-an-email', password: 'Password123!' });

      expect(res.status).toBe(422);
    });

    it('should return 422 with missing password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com' });

      expect(res.status).toBe(422);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return 200 when authenticated', async () => {
      const token = makeAccessToken({
        userId: mockUser._id,
        email: mockUser.email,
        role: 'admin',
        permissions: mockUser.roleId.permissions,
      });

      (User.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockUser),
      });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', [`accessToken=${token}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe('test@example.com');
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const token = makeAccessToken({
        userId: mockUser._id,
        email: mockUser.email,
        role: 'admin',
        permissions: mockUser.roleId.permissions,
      });
      (RefreshToken.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 1 });

      const res = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', [`accessToken=${token}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
