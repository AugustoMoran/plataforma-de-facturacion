import { Request, Response } from 'express';
import * as checkoutService from '../services/checkoutService';
import { User } from '../../auth/models/User';
import { normalizeCustomerAddress, isCustomerRole } from '../../auth/services/customerProfileService';

export const checkoutController = async (req: Request, res: Response) => {
  try {
    const authUser = (req as any).user;
    const userId = authUser?.id;
    const body = req.body || {};

    let sale;
    if (body.cartId) {
      sale = await checkoutService.checkoutCart({ ...body, userId });
    } else {
      sale = await checkoutService.checkoutDirect({ ...body, userId });
    }

    if (authUser && isCustomerRole(authUser.roles || []) && body.saveShippingToProfile) {
      const user = await User.findById(authUser.id);
      if (user) {
        if (body.customerPhone) user.phone = String(body.customerPhone).trim();
        if (body.shippingAddress) {
          user.defaultShippingAddress = normalizeCustomerAddress(body.shippingAddress);
        }
        await user.save();
      }
    }

    res.status(201).json(sale);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
