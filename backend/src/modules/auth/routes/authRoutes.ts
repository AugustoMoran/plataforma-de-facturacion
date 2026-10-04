import { Router } from 'express';
import { 
  registerController,
  publicRegisterController,
  loginController,
  logoutController, 
  refreshController,
  getMeController, 
  getUsersController, 
  deleteUserController,
  updatePermissionsController,
  updateCommissionController,
  updateBranchController,
  updateProfileController,
  verifyEmailController,
  resendVerificationController,
  getStoreCustomersController,
} from '../controllers/authController';
import { authenticate, authorize } from '../../../middleware/authMiddleware';
import { User } from '../models/User';
import { getRegisterSetupController } from '../controllers/authController';

const router = Router();

// Special middleware for register: Allow if first user OR if requester is Admin
const canRegister = async (req: any, res: any, next: any) => {
  const count = await User.countDocuments();
  if (count === 0) return next();

  const hasAuthHeader = Boolean(req.headers.authorization);
  const hasAccessCookie = Boolean(req.cookies?.accessToken);
  if (!hasAuthHeader && !hasAccessCookie) {
    return res.status(403).json({
      message:
        'El panel ya está configurado. Iniciá sesión si tenés cuenta de gestión, o registrate en la tienda para comprar.',
      code: 'STAFF_REGISTRATION_CLOSED',
    });
  }

  return authenticate(req, res, () => {
    return authorize('admin')(req, res, next);
  });
};

router.get('/register/setup', getRegisterSetupController);
router.post('/register/public', publicRegisterController);
router.post('/register', canRegister, registerController);
router.get('/users', authenticate, authorize('admin'), getUsersController);
router.get('/customers', authenticate, authorize('admin'), getStoreCustomersController);
router.patch('/profile', authenticate, updateProfileController);
router.get('/verify-email', verifyEmailController);
router.post('/verify-email', verifyEmailController);
router.post('/resend-verification', authenticate, resendVerificationController);
router.delete('/users/:id', authenticate, authorize('admin'), deleteUserController);
router.patch('/users/permissions', authenticate, authorize('admin'), updatePermissionsController);
router.patch('/users/commission', authenticate, authorize('admin'), updateCommissionController);
router.patch('/users/branch', authenticate, authorize('admin'), updateBranchController);
router.post('/login', loginController);
router.get('/me', authenticate, getMeController);
router.post('/refresh', refreshController);
router.post('/logout', logoutController);

export default router;
