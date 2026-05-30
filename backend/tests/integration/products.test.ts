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
const FULL_PERMISSIONS = {
  viewProducts: true, createProducts: true, editProducts: true, deleteProducts: true,
  viewStock: true, adjustStock: true, transferStock: true,
  viewSales: true, createSales: true, cancelSales: true, refundSales: true,
  viewUsers: true, createUsers: true, editUsers: true, deleteUsers: true,
  viewBranches: true, manageBranches: true,
  viewReports: true, exportReports: true,
  manageAfip: true, manageRoles: true, managePermissions: true, manageCategories: true,
};

const ADMIN_USER_ID = '507f1f77bcf86cd799439011';
const CATEGORY_ID   = '507f1f77bcf86cd799439013';

const mockAdminUser = {
  _id: ADMIN_USER_ID,
  email: 'admin@test.com',
  firstName: 'Admin',
  lastName: 'Test',
  isActive: true,
  isDeleted: false,
  roleId: {
    _id: '507f1f77bcf86cd799439012',
    name: 'admin',
    permissions: FULL_PERMISSIONS,
  },
  permissions: {},
};

jest.mock('../../src/database/models/user.model', () => ({
  User: {
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
  },
}));

jest.mock('../../src/database/models/product.model', () => ({
  Product: {
    find: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    countDocuments: jest.fn(),
  },
}));

jest.mock('../../src/database/models/category.model', () => ({
  Category: {
    find: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock('../../src/database/models/role.model', () => ({
  Role: {
    findOne: jest.fn(),
    findById: jest.fn(),
  },
}));

jest.mock('../../src/database/models/refresh-token.model', () => ({
  RefreshToken: {
    findOne: jest.fn(),
    create: jest.fn(),
    deleteOne: jest.fn(),
    deleteMany: jest.fn(),
  },
}));

// ── Import app after mocks ────────────────────────────────────────────────────
import { createApp } from '../../src/app';
import { User } from '../../src/database/models/user.model';
import { Product } from '../../src/database/models/product.model';

const app = createApp();
const ACCESS_SECRET = process.env['JWT_ACCESS_SECRET']!;

const adminAccessToken = jwt.sign(
  { userId: ADMIN_USER_ID, email: 'admin@test.com', role: 'admin', permissions: FULL_PERMISSIONS },
  ACCESS_SECRET,
  { expiresIn: '15m' },
);

beforeEach(() => {
  jest.clearAllMocks();

  // Default: auth middleware resolves admin user
  (User.findById as jest.Mock).mockReturnValue({
    populate: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(mockAdminUser),
  });
});

// ── Products Routes ───────────────────────────────────────────────────────────
describe('Products Routes', () => {
  describe('GET /api/products', () => {
    it('should return paginated products', async () => {
      const mockProducts = [
        { _id: '1', name: 'Product 1', categoryId: CATEGORY_ID, cost: 100, ivaPercentage: 21, profitPercentage: 30, publicPrice: 157.30 },
        { _id: '2', name: 'Product 2', categoryId: CATEGORY_ID, cost: 200, ivaPercentage: 21, profitPercentage: 20, publicPrice: 290.40 },
      ];

      (Product.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockProducts),
      });
      (Product.countDocuments as jest.Mock).mockResolvedValue(2);

      const res = await request(app)
        .get('/api/products')
        .set('Cookie', [`accessToken=${adminAccessToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.pagination.total).toBe(2);
    });

    it('should require authentication', async () => {
      const res = await request(app).get('/api/products');
      expect(res.status).toBe(401);
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

    it('should return 422 with missing required fields', async () => {
      const res = await request(app)
        .post('/api/products/calculate-price')
        .set('Cookie', [`accessToken=${adminAccessToken}`])
        .send({ cost: 100 }); // missing ivaPercentage

      expect(res.status).toBe(422);
    });
  });

  describe('POST /api/products', () => {
    it('should require authentication', async () => {
      const res = await request(app)
        .post('/api/products')
        .send({ name: 'Test Product', categoryId: CATEGORY_ID, cost: 100, ivaPercentage: 21 });

      expect(res.status).toBe(401);
    });
  });
});
