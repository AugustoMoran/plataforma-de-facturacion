import { Request, Response } from 'express';
import Sale from '../../sales/models/Sale';

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
