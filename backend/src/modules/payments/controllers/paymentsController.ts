import { Request, Response } from 'express';
import * as paywayService from '../services/paywayService';
import { markSalePaid } from '../services/paymentSaleSync';
import Sale from '../../sales/models/Sale';

export const getPaywayConfigController = async (_req: Request, res: Response) => {
  try {
    res.json(paywayService.getPaywayPublicConfig());
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createPaywayCheckoutController = async (req: Request, res: Response) => {
  try {
    const { saleId, payerEmail } = req.body;
    const sale = await Sale.findById(saleId);
    if (!sale) return res.status(404).json({ message: 'Venta no encontrada' });

    const session = await paywayService.createCheckoutSession({
      saleId: String(sale._id),
      title: `Pedido ${sale.invoiceNumber}`,
      total: sale.total,
      payerEmail: payerEmail || sale.clientName || 'cliente@tienda.com',
      payerIp: req.ip,
      backUrls: req.body?.backUrls,
    });

    await Sale.findByIdAndUpdate(saleId, {
      paymentId: session.id,
      paymentStatus: 'pending',
      paymentMethod: 'payway',
    });

    res.json({
      id: session.id,
      checkoutUrl: session.checkoutUrl,
      transactionId: session.transactionId,
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const paywayWebhookController = async (req: Request, res: Response) => {
  try {
    const result = await paywayService.processWebhookNotification(req.body || req.query);

    if (result.processed && result.paymentId) {
      const sale = await Sale.findOne({ paymentId: result.paymentId });
      if (sale) {
        await markSalePaid(String(sale._id), result.status);
      }
    }

    res.status(200).json({ ok: true, ...result });
  } catch (error: any) {
    res.status(200).json({ ok: false, message: error.message });
  }
};

export const getPaywayPaymentStatusController = async (req: Request, res: Response) => {
  try {
    const payment = await paywayService.getPaymentById(req.params.paymentId);
    res.json(payment);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const syncPaywaySaleStatusController = async (req: Request, res: Response) => {
  try {
    const sale = await Sale.findById(req.params.saleId);
    if (!sale) return res.status(404).json({ message: 'Venta no encontrada' });
    if (!sale.paymentId) {
      return res.json({ saleId: sale._id, paymentStatus: sale.paymentStatus || 'pending' });
    }

    const payment = await paywayService.getPaymentById(String(sale.paymentId));
    const paymentStatus = paywayService.mapPaywayPaymentStatus(payment?.status);
    await markSalePaid(String(sale._id), paymentStatus);

    res.json({
      saleId: sale._id,
      paymentId: sale.paymentId,
      paymentStatus,
      rawStatus: payment?.status,
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
