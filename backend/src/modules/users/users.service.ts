import { NextFunction, Request, Response } from 'express';

import { Role } from '../../database/models/role.model';
import { User } from '../../database/models/user.model';
import type { PermissionsMap } from '../../shared/types';
import { AppError } from '../../middleware/error.middleware';
import { getSocketServer } from '../../sockets/socket.server';
import { SOCKET_EVENTS } from '../../shared/types';
import { validateObjectId, sanitizeSearchString } from '../../shared/utils/validation';

export class UsersService {
  async getAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    roleId?: string;
    branchId?: string;
    isActive?: boolean;
  }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = { isDeleted: false };
    if (query.search) {
      const safeSearch = sanitizeSearchString(query.search);
      filter['$or'] = [
        { firstName: { $regex: safeSearch, $options: 'i' } },
        { lastName: { $regex: safeSearch, $options: 'i' } },
        { email: { $regex: safeSearch, $options: 'i' } },
      ];
    }
    if (query.roleId) filter['roleId'] = validateObjectId(query.roleId, 'roleId');
    if (query.branchId) filter['branchId'] = validateObjectId(query.branchId, 'branchId');
    if (query.isActive !== undefined) filter['isActive'] = query.isActive;

    const [users, total] = await Promise.all([
      User.find(filter)
        .populate('roleId', 'name displayName')
        .populate('branchId', 'name')
        .select('-password')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      User.countDocuments(filter),
    ]);

    return {
      data: users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  async getById(id: string) {
    validateObjectId(id);
    const user = await User.findOne({ _id: id, isDeleted: false })
      .populate('roleId', 'name displayName permissions')
      .populate('branchId', 'name')
      .select('-password')
      .lean();

    if (!user) throw new AppError('User not found', 404);
    return user;
  }

  async create(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    roleId: string;
    branchId?: string;
    commissionPercentage?: number;
    permissions?: Partial<PermissionsMap>;
  }) {
    // Explicitly cast email to string to prevent NoSQL injection via object payloads
    const email = String(data.email).toLowerCase().trim();
    const existingUser = await User.findOne({ email, isDeleted: false });
    if (existingUser) throw new AppError('Email already in use', 409);

    if (data.roleId) validateObjectId(data.roleId, 'roleId');
    const role = await Role.findById(data.roleId);
    if (!role) throw new AppError('Role not found', 404);

    const user = await User.create(data);
    const populated = await User.findById(user._id)
      .populate('roleId', 'name displayName')
      .populate('branchId', 'name')
      .select('-password')
      .lean();

    return populated;
  }

  async update(
    id: string,
    data: Partial<{
      firstName: string;
      lastName: string;
      roleId: string;
      branchId: string;
      commissionPercentage: number;
      isActive: boolean;
      permissions: Partial<PermissionsMap>;
    }>,
  ) {
    validateObjectId(id);
    const user = await User.findOne({ _id: id, isDeleted: false });
    if (!user) throw new AppError('User not found', 404);

    if (data.roleId) {
      validateObjectId(data.roleId, 'roleId');
      const role = await Role.findById(data.roleId);
      if (!role) throw new AppError('Role not found', 404);
    }
    if (data.branchId) validateObjectId(data.branchId, 'branchId');

    Object.assign(user, data);
    await user.save();

    const updatedUser = await User.findById(id)
      .populate('roleId', 'name displayName permissions')
      .populate('branchId', 'name')
      .select('-password')
      .lean();

    // Emit real-time permissions update
    const io = getSocketServer();
    if (io && data.permissions !== undefined) {
      io.to(`user:${id}`).emit(SOCKET_EVENTS.PERMISSIONS_UPDATED, {
        userId: id,
        permissions: updatedUser?.permissions,
      });
    }

    return updatedUser;
  }

  async updatePassword(id: string, newPassword: string): Promise<void> {
    validateObjectId(id);
    const user = await User.findOne({ _id: id, isDeleted: false });
    if (!user) throw new AppError('User not found', 404);
    user.password = newPassword;
    await user.save();
  }

  async softDelete(id: string): Promise<void> {
    validateObjectId(id);
    const user = await User.findOne({ _id: id, isDeleted: false });
    if (!user) throw new AppError('User not found', 404);
    user.isDeleted = true;
    user.isActive = false;
    await user.save();
  }
}

export const usersService = new UsersService();
