import { Request, Response } from 'express';
import Sale from '../../sales/models/Sale';

export const getMyStoreOrdersController = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ message: 'Not authenticated' });

    const orders = await Sale.find({
      source: 'ECOMMERCE',
      $or: [{ buyerUserId: user._id }, { customerEmail: user.email }],
    })
      .select('-seller -branch -sellerCommissionRate')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json(orders);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getStoreOrderController = async (req: Request, res: Response) => {
  try {
    const sale = await Sale.findOne({ _id: req.params.id, source: 'ECOMMERCE' }).select(
      '-seller -branch -sellerCommissionRate'
    );
    if (!sale) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }
    res.json(sale);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
