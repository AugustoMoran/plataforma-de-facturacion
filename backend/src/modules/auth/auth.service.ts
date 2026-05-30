import crypto from 'crypto';

import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

import { config } from '../../config/env';
import { RefreshToken } from '../../database/models/refresh-token.model';
import { User } from '../../database/models/user.model';
import type { AuthTokenPayload, PermissionsMap } from '../../shared/types';
import { AppError } from '../../middleware/error.middleware';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export class AuthService {
  private generateAccessToken(payload: AuthTokenPayload): string {
    return jwt.sign(payload, config.jwt.accessSecret, {
      expiresIn: config.jwt.accessExpiry,
      issuer: 'facturacion-api',
    } as jwt.SignOptions);
  }

  private generateRefreshToken(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  async login(
    dto: LoginDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ tokenPair: TokenPair; user: Record<string, unknown> }> {
    // Explicitly cast to string to prevent NoSQL injection via object payloads
    const email = String(dto.email).toLowerCase().trim();
    const user = await User.findOne({ email, isDeleted: false })
      .select('+password')
      .populate('roleId')
      .lean();

    if (!user || !user.isActive) {
      throw new AppError('Invalid credentials', 401);
    }

    const isPasswordValid = await (await User.findById(user._id).select('+password'))!.comparePassword(dto.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }

    const roleDoc = user.roleId as any;
    const mergedPermissions: Partial<PermissionsMap> = {
      ...roleDoc?.permissions,
      ...user.permissions,
    };

    const payload: AuthTokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: roleDoc?.name ?? 'vendedor',
      branchId: user.branchId?.toString(),
      permissions: mergedPermissions as Record<string, boolean>,
    };

    const accessToken = this.generateAccessToken(payload);
    const rawRefreshToken = this.generateRefreshToken();
    const family = uuidv4();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await RefreshToken.create({
      userId: user._id,
      token: rawRefreshToken,
      family,
      expiresAt,
      ipAddress,
      userAgent,
    });

    // Update last login
    await User.updateOne({ _id: user._id }, { lastLogin: new Date() });

    return {
      tokenPair: { accessToken, refreshToken: rawRefreshToken },
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: roleDoc?.name,
        branchId: user.branchId,
        permissions: mergedPermissions,
        commissionPercentage: user.commissionPercentage,
      },
    };
  }

  async refreshTokens(
    rawRefreshToken: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<TokenPair> {
    const storedToken = await RefreshToken.findOne({
      token: rawRefreshToken,
      isRevoked: false,
    });

    if (!storedToken) {
      throw new AppError('Invalid refresh token', 401);
    }

    if (storedToken.expiresAt < new Date()) {
      await RefreshToken.updateMany({ family: storedToken.family }, { isRevoked: true });
      throw new AppError('Refresh token expired', 401);
    }

    // Rotate: revoke used token
    await RefreshToken.updateOne({ _id: storedToken._id }, { isRevoked: true });

    const user = await User.findById(storedToken.userId).populate('roleId').lean();
    if (!user || !user.isActive || user.isDeleted) {
      throw new AppError('User not found or inactive', 401);
    }

    const roleDoc = user.roleId as any;
    const mergedPermissions: Partial<PermissionsMap> = {
      ...roleDoc?.permissions,
      ...user.permissions,
    };

    const payload: AuthTokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: roleDoc?.name ?? 'vendedor',
      branchId: user.branchId?.toString(),
      permissions: mergedPermissions as Record<string, boolean>,
    };

    const newAccessToken = this.generateAccessToken(payload);
    const newRawRefreshToken = this.generateRefreshToken();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await RefreshToken.create({
      userId: user._id,
      token: newRawRefreshToken,
      family: storedToken.family,
      expiresAt,
      ipAddress,
      userAgent,
    });

    return { accessToken: newAccessToken, refreshToken: newRawRefreshToken };
  }

  async logout(rawRefreshToken: string): Promise<void> {
    if (!rawRefreshToken) return;

    const storedToken = await RefreshToken.findOne({ token: rawRefreshToken });
    if (storedToken) {
      // Invalidate entire token family on logout
      await RefreshToken.updateMany({ family: storedToken.family }, { isRevoked: true });
    }
  }

  async logoutAllDevices(userId: string): Promise<void> {
    await RefreshToken.updateMany({ userId, isRevoked: false }, { isRevoked: true });
  }
}

export const authService = new AuthService();
