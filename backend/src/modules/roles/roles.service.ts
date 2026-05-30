import { NextFunction, Request, Response } from 'express';

import { Role } from '../../database/models/role.model';
import { User } from '../../database/models/user.model';
import type { PermissionsMap } from '../../shared/types';
import { AppError } from '../../middleware/error.middleware';
import { getSocketServer } from '../../sockets/socket.server';
import { SOCKET_EVENTS } from '../../shared/types';

export class RolesService {
  async getAll() {
    return Role.find({ isActive: true }).lean();
  }

  async getById(id: string) {
    const role = await Role.findById(id).lean();
    if (!role) throw new AppError('Role not found', 404);
    return role;
  }

  async create(data: {
    name: string;
    displayName: string;
    description?: string;
    permissions?: Partial<PermissionsMap>;
  }) {
    const existing = await Role.findOne({ name: data.name.toLowerCase() });
    if (existing) throw new AppError('Role name already exists', 409);
    return Role.create(data);
  }

  async update(
    id: string,
    data: Partial<{
      displayName: string;
      description: string;
      permissions: Partial<PermissionsMap>;
      isActive: boolean;
    }>,
  ) {
    const role = await Role.findById(id);
    if (!role) throw new AppError('Role not found', 404);
    if (role.isSystem && data.permissions !== undefined) {
      // Allow updating permissions even for system roles
    }

    Object.assign(role, data);
    const updated = await role.save();

    // Emit permissions update to all users with this role
    const io = getSocketServer();
    if (io && data.permissions !== undefined) {
      const usersWithRole = await User.find({ roleId: id, isActive: true, isDeleted: false }).select('_id').lean();
      for (const user of usersWithRole) {
        io.to(`user:${user._id}`).emit(SOCKET_EVENTS.PERMISSIONS_UPDATED, {
          roleId: id,
          permissions: updated.permissions,
        });
      }
    }

    return updated;
  }

  async delete(id: string): Promise<void> {
    const role = await Role.findById(id);
    if (!role) throw new AppError('Role not found', 404);
    if (role.isSystem) throw new AppError('Cannot delete system roles', 400);

    const usersWithRole = await User.countDocuments({ roleId: id, isDeleted: false });
    if (usersWithRole > 0) {
      throw new AppError('Cannot delete role with assigned users', 400);
    }

    role.isActive = false;
    await role.save();
  }
}

export const rolesService = new RolesService();
