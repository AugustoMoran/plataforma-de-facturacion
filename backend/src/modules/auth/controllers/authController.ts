import { Request, Response } from 'express';
import { register, validateUser, tokenService } from '../services/authService';
import { User } from '../models/User';
import Branch from '../../branches/models/Branch';
import Sale from '../../sales/models/Sale';
import { io } from '../../../app';
import {
  clearAuthCookies,
  serializeAuthUser,
  setAuthCookies,
} from '../utils/authCookies';
import { normalizeCustomerAddress, isCustomerRole } from '../services/customerProfileService';
import { issueEmailVerification, resendEmailVerification, verifyEmailByToken } from '../services/emailVerificationService';
import { getEmailDeliverability, isInstitutionalEmail } from '../services/emailDeliverability';
import { getMailerConfigStatus } from '../../notifications/services/mailerService';

const INSTITUTIONAL_EMAIL_MESSAGE =
  'Las casillas institucionales (@edu.ar, @ac.ar, etc.) suelen bloquear correos externos. Usá un email personal (Gmail, Outlook, etc.) para recibir el enlace de verificación.';

export async function getRegisterSetupController(_req: Request, res: Response) {
  const userCount = await User.countDocuments();
  res.json({
    staffBootstrapOpen: userCount === 0,
    storeRegistrationAvailable: true,
  });
}

export async function registerController(req: Request, res: Response) {
  const { email, password, roles, permissions, name, branch, commissionRate } = req.body;
  
  // Note: authRoutes will protect this with 'admin' authorization or check for first user
  const user = await register(email, password, roles, permissions, name, branch, commissionRate);
  res.json({ id: user.id, name: user.name, email: user.email, roles: user.roles, permissions: user.permissions, branch: user.branch, commissionRate: user.commissionRate });
}

export async function publicRegisterController(req: Request, res: Response) {
  try {
    const { email, password, name, phone, shippingAddress, marketingOptIn } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Nombre, email y contraseña son requeridos' });
    }

    if (String(password).length < 8) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres' });
    }

    const address = normalizeCustomerAddress(shippingAddress);
    if (!address?.province || !address?.postalCode || address.postalCode.length !== 4) {
      return res.status(400).json({ message: 'Completá provincia y código postal válido para el envío' });
    }
    if (!address.street || !address.city) {
      return res.status(400).json({ message: 'Completá calle y ciudad de tu dirección' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ message: 'El email ya está registrado' });
    }
    const emailDeliverability = getEmailDeliverability(normalizedEmail);

    const user = await register(
      normalizedEmail,
      String(password),
      ['user'],
      {},
      String(name).trim(),
      undefined,
      undefined,
      {
        phone: String(phone || '').trim() || undefined,
        defaultShippingAddress: address,
        marketingOptIn: Boolean(marketingOptIn),
      },
      { enforceRoles: true }
    );

    let verification = { mailSent: false as boolean };
    if (emailDeliverability === 'ok') {
      verification = await issueEmailVerification(user);
    }

    const access = tokenService.signAccessToken(user as any);
    const refresh = tokenService.signRefreshToken(user as any);
    user.refreshTokens.push({ token: refresh, createdAt: new Date() });
    user.markModified('refreshTokens');
    await user.save({ validateBeforeSave: false });
    setAuthCookies(res, access, refresh);

    res.status(201).json({
      user: serializeAuthUser(user),
      verificationEmailSent: verification.mailSent,
      emailDeliverability,
      mailerConfigured: getMailerConfigStatus().configured,
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}

export async function updateProfileController(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ message: 'Not authenticated' });
    if (!isCustomerRole(user.roles || [])) {
      return res.status(403).json({ message: 'Solo clientes de la tienda pueden editar este perfil' });
    }

    const { name, phone, defaultShippingAddress, marketingOptIn } = req.body || {};
    if (name) user.name = String(name).trim();
    if (phone !== undefined) user.phone = String(phone || '').trim() || undefined;
    if (defaultShippingAddress !== undefined) {
      user.defaultShippingAddress = normalizeCustomerAddress(defaultShippingAddress);
    }
    if (marketingOptIn !== undefined) user.marketingOptIn = Boolean(marketingOptIn);

    await user.save();
    res.json(serializeAuthUser(user));
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}

export async function verifyEmailController(req: Request, res: Response) {
  try {
    const token = String(req.query.token || req.body?.token || '');
    if (!token) return res.status(400).json({ message: 'Token requerido' });
    const user = await verifyEmailByToken(token);
    res.json({ ok: true, user: serializeAuthUser(user) });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}

export async function changeCustomerEmailController(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ message: 'Not authenticated' });
    if (!isCustomerRole(user.roles || [])) {
      return res.status(403).json({ message: 'Solo clientes de la tienda pueden cambiar este email' });
    }
    if (user.emailVerified) {
      return res.status(400).json({ message: 'El email ya está verificado y no se puede cambiar desde acá' });
    }

    const newEmail = String(req.body?.newEmail || '').trim().toLowerCase();
    if (!newEmail || !newEmail.includes('@')) {
      return res.status(400).json({ message: 'Ingresá un email válido' });
    }
    if (isInstitutionalEmail(newEmail)) {
      return res.status(400).json({
        code: 'EMAIL_INSTITUTIONAL',
        message: INSTITUTIONAL_EMAIL_MESSAGE,
        emailDeliverability: 'institutional',
      });
    }

    const existing = await User.findOne({ email: newEmail });
    if (existing && String(existing._id) !== String(user._id)) {
      return res.status(409).json({ message: 'Ese email ya está registrado en otra cuenta' });
    }

    user.email = newEmail;
    await user.save();

    const verification = await issueEmailVerification(user);

    res.json({
      user: serializeAuthUser(user),
      verificationEmailSent: verification.mailSent,
      emailDeliverability: getEmailDeliverability(newEmail),
      mailerConfigured: getMailerConfigStatus().configured,
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}

export async function resendVerificationController(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ message: 'Not authenticated' });

    if (!user.emailVerified && isInstitutionalEmail(user.email)) {
      return res.status(400).json({
        code: 'EMAIL_INSTITUTIONAL',
        message: INSTITUTIONAL_EMAIL_MESSAGE,
        emailDeliverability: 'institutional',
      });
    }

    const result = await resendEmailVerification(user);
    const payload = {
      alreadyVerified: result.alreadyVerified,
      mailSent: result.mailSent,
      sentTo: result.sentTo,
      mailerConfigured: getMailerConfigStatus().configured,
    };

    if (!result.alreadyVerified && !result.mailSent) {
      return res.status(502).json({
        message: 'No pudimos enviar el email de verificación. Probá con otro email personal.',
        ...payload,
      });
    }

    res.json(payload);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}

export async function getStoreCustomersController(req: Request, res: Response) {
  const customers = await User.find({ roles: 'user' }, '-password -refreshTokens -emailVerificationTokenHash')
    .sort({ createdAt: -1 })
    .lean();

  const stats = await Sale.aggregate([
    { $match: { source: 'ECOMMERCE' } },
    {
      $group: {
        _id: {
          buyerUserId: '$buyerUserId',
          customerEmail: '$customerEmail',
        },
        ordersCount: { $sum: 1 },
        totalSpent: { $sum: '$total' },
        lastOrderAt: { $max: '$createdAt' },
      },
    },
  ]);

  const statsByUserId = new Map<string, any>();
  const statsByEmail = new Map<string, any>();
  for (const row of stats) {
    const payload = {
      ordersCount: row.ordersCount,
      totalSpent: row.totalSpent,
      lastOrderAt: row.lastOrderAt,
    };
    if (row._id.buyerUserId) statsByUserId.set(String(row._id.buyerUserId), payload);
    if (row._id.customerEmail) statsByEmail.set(String(row._id.customerEmail).toLowerCase(), payload);
  }

  const enriched = customers.map((customer) => {
    const byId = statsByUserId.get(String(customer._id));
    const byEmail = statsByEmail.get(String(customer.email).toLowerCase());
    const metrics = byId || byEmail || { ordersCount: 0, totalSpent: 0, lastOrderAt: null };
    return { ...customer, metrics };
  });

  res.json(enriched);
}

export async function updateCommissionController(req: Request, res: Response) {
  const { userId, commissionRate } = req.body;

  const parsedRate = Number(commissionRate);
  if (!Number.isFinite(parsedRate) || parsedRate < 0) {
    return res.status(400).json({ message: 'commissionRate inválido' });
  }

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  user.commissionRate = parsedRate;
  await user.save();

  res.json({ message: 'Commission updated successfully', commissionRate: user.commissionRate });
}

export async function updateBranchController(req: Request, res: Response) {
  const { userId, branchId } = req.body;

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  if (!branchId) {
    user.branch = undefined as any;
    await user.save();
    return res.json({ message: 'Branch unassigned successfully', branch: null });
  }

  const branch = await Branch.findOne({ _id: branchId, isActive: true });
  if (!branch) {
    return res.status(400).json({ message: 'Sucursal inválida o inactiva' });
  }

  user.branch = branch._id as any;
  await user.save();

  return res.json({ message: 'Branch updated successfully', branch: branch._id });
}

export async function updatePermissionsController(req: Request, res: Response) {
  const { userId, permissions } = req.body;
  
  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  user.permissions = permissions;
  user.markModified('permissions');
  await user.save();

  // Notificar por socket para actualización en tiempo real
  if (io) {
    io.to(`user:${userId}`).emit('permissions_updated', user.permissions);
  }

  res.json({ message: 'Permissions updated successfully', permissions: user.permissions });
}

export async function getUsersController(req: Request, res: Response) {
  const users = await User.find({}, '-password -refreshTokens');
  res.json(users);
}

export async function deleteUserController(req: Request, res: Response) {
  const targetUserId = String(req.params.id || '');
  const requesterId = String((req as any)?.user?.id || '');

  if (!targetUserId) {
    return res.status(400).json({ message: 'userId requerido' });
  }

  if (targetUserId === requesterId) {
    return res.status(400).json({ message: 'No podés eliminar tu propio usuario' });
  }

  const user = await User.findById(targetUserId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if ((user.roles || []).includes('admin')) {
    return res.status(400).json({ message: 'No se puede eliminar un usuario administrador' });
  }

  await User.findByIdAndDelete(targetUserId);
  return res.json({ message: 'Usuario eliminado correctamente' });
}

export async function loginController(req: Request, res: Response) {
  const { email, password } = req.body;
  const user = await validateUser(email, password);
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  const access = tokenService.signAccessToken(user as any);
  const refresh = tokenService.signRefreshToken(user as any);

  user.refreshTokens.push({ token: refresh, createdAt: new Date() });
  user.markModified('refreshTokens');
  await user.save({ validateBeforeSave: false });

  setAuthCookies(res, access, refresh);
  res.json({ user: serializeAuthUser(user) });
}

export async function getMeController(req: Request, res: Response) {
  const user = (req as any).user;
  if (!user) return res.status(401).json({ message: 'Not authenticated' });
  res.json(serializeAuthUser(user));
}

export async function refreshController(req: Request, res: Response) {
  const rt = req.cookies?.refreshToken;
  if (!rt) return res.status(401).json({ message: 'No refresh token' });

  try {
    const payload: any = tokenService.verifyRefreshToken(rt);
    const userId = payload.sub;

    const user = await User.findById(userId);
    if (!user) return res.status(401).json({ message: 'Invalid token' });

    let newRefresh;
    try {
      newRefresh = await tokenService.rotateRefreshToken(userId, rt);
    } catch (err) {
      await tokenService.revokeRefreshToken(userId);
      clearAuthCookies(res);
      return res.status(401).json({ message: 'Refresh token reuse detected' });
    }

    const access = tokenService.signAccessToken(user as any);
    setAuthCookies(res, access, newRefresh);
    res.json({ user: serializeAuthUser(user) });
  } catch (err) {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
}

export async function logoutController(req: Request, res: Response) {
  const rt = req.cookies?.refreshToken;
  if (rt) {
    try {
      const payload: any = tokenService.verifyRefreshToken(rt);
      await tokenService.revokeRefreshToken(payload.sub, rt);
    } catch (err) {
      // ignore
    }
  }
  clearAuthCookies(res);
  res.json({ ok: true });
}
