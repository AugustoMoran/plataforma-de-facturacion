import { Branch } from '../../database/models/branch.model';
import { User } from '../../database/models/user.model';
import { AppError } from '../../middleware/error.middleware';

export class BranchesService {
  async getAll(query: { page?: number; limit?: number; search?: string }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const filter: Record<string, unknown> = { isDeleted: false };
    if (query.search) {
      filter['name'] = { $regex: query.search, $options: 'i' };
    }
    const [branches, total] = await Promise.all([
      Branch.find(filter)
        .populate('managerUserId', 'firstName lastName email')
        .skip(skip)
        .limit(limit)
        .sort({ name: 1 })
        .lean(),
      Branch.countDocuments(filter),
    ]);
    return {
      data: branches,
      pagination: {
        total, page, limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  async getById(id: string) {
    const branch = await Branch.findOne({ _id: id, isDeleted: false })
      .populate('managerUserId', 'firstName lastName email')
      .lean();
    if (!branch) throw new AppError('Branch not found', 404);
    return branch;
  }

  async create(data: { name: string; address: string; phone?: string; email?: string; managerUserId?: string }) {
    const existing = await Branch.findOne({ name: data.name, isDeleted: false });
    if (existing) throw new AppError('Branch name already exists', 409);
    return Branch.create(data);
  }

  async update(id: string, data: Partial<{ name: string; address: string; phone: string; email: string; isActive: boolean; managerUserId: string }>) {
    const branch = await Branch.findOne({ _id: id, isDeleted: false });
    if (!branch) throw new AppError('Branch not found', 404);
    Object.assign(branch, data);
    return branch.save();
  }

  async getVendedores(branchId: string) {
    return User.find({ branchId, isActive: true, isDeleted: false })
      .populate('roleId', 'name displayName')
      .select('-password')
      .lean();
  }

  async assignVendedor(branchId: string, userId: string): Promise<void> {
    const branch = await Branch.findOne({ _id: branchId, isDeleted: false });
    if (!branch) throw new AppError('Branch not found', 404);
    const user = await User.findOne({ _id: userId, isDeleted: false });
    if (!user) throw new AppError('User not found', 404);
    user.branchId = branch._id as any;
    await user.save();
  }

  async softDelete(id: string): Promise<void> {
    const branch = await Branch.findOne({ _id: id, isDeleted: false });
    if (!branch) throw new AppError('Branch not found', 404);
    branch.isDeleted = true;
    branch.isActive = false;
    await branch.save();
  }
}

export const branchesService = new BranchesService();
