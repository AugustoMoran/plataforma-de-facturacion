import { Request, Response } from 'express';
import * as cartService from '../services/cartService';

export const syncCartController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Debés iniciar sesión para sincronizar el carrito' });
    }

    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    const cart = await cartService.syncCartFromClientItems(userId, items);
    res.json(cart);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
