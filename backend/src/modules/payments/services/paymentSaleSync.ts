import { Request, Response } from 'express';
import Sale from '../../sales/models/Sale';
import * as dispatchService from '../../shipping/services/dispatchService';

const markSalePaid = async (saleId: string, paymentStatus: string) => {
  const existingSale = await Sale.findById(saleId);
  const isStorePickup = existingSale?.shippingQuote?.carrierId === 'store';

  const sale = await Sale.findByIdAndUpdate(
    saleId,
    {
      paymentStatus,
      ...(paymentStatus === 'approved'
        ? { shippingStatus: isStorePickup ? 'awaiting_pickup' : 'awaiting_dispatch' }
        : {}),
    },
    { new: true }
  );

  if (sale && paymentStatus === 'approved' && sale.source === 'ECOMMERCE' && sale.shippingQuote && !isStorePickup) {
    try {
      await dispatchService.createEnvioPackPedidoForSale(String(sale._id));
    } catch (error: any) {
      console.error('[EnvioPack] No se pudo crear pedido automático:', error?.message || error);
    }
  }

  return sale;
};

export { markSalePaid };
