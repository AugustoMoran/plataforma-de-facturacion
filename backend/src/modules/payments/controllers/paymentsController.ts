import { Request, Response } from 'express';
import * as paywayService from '../services/paywayService';
import { markSalePaid } from '../services/paymentSaleSync';
import Sale from '../../sales/models/Sale';

const resolvePayerEmail = (sale: { customerEmail?: string; clientName?: string }, payerEmail?: string) => {
  const candidates = [payerEmail, sale.customerEmail, sale.clientName]
    .map((value) => String(value || '').trim().toLowerCase())
    .filter(Boolean);

  return candidates.find((email) => paywayService.isValidPaywayEmail(email));
};

const findSaleForPaywayResult = async (result: {
  paymentId?: string;
  transactionId?: string;
}) => {
  if (result.transactionId) {
    const byTransaction = await Sale.findOne({ paywayTransactionId: result.transactionId });
    if (byTransaction) return byTransaction;
  }

  if (result.paymentId) {
    const byPaymentId = await Sale.findOne({ paymentId: result.paymentId });
    if (byPaymentId) return byPaymentId;
  }

  return null;
};

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

    const email = resolvePayerEmail(sale, payerEmail);
    if (!email) {
      return res.status(400).json({ message: 'Ingresá un email válido para continuar con el pago.' });
    }

    const session = await paywayService.createCheckoutSession({
      saleId: String(sale._id),
      title: `Pedido ${sale.invoiceNumber}`,
      total: sale.total,
      payerEmail: email,
      payerIp: req.ip,
      backUrls: req.body?.backUrls,
    });

    await Sale.findByIdAndUpdate(saleId, {
      paywayFormHash: session.formHash,
      paywayTransactionId: session.transactionId,
      paymentStatus: 'pending',
      paymentMethod: 'payway',
      customerEmail: email,
    });

    res.json({
      id: session.formHash,
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

    if (result.processed) {
      const sale = await findSaleForPaywayResult(result);
      if (sale) {
        if (result.paymentId) {
          sale.paymentId = result.paymentId;
          await sale.save();
        }
        await markSalePaid(String(sale._id), result.status || 'pending');
      }
    } else if (result.transactionId) {
      const sale = await Sale.findOne({ paywayTransactionId: result.transactionId });
      if (sale) {
        await markSalePaid(String(sale._id), 'pending');
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

    if (!sale.paywayTransactionId && !sale.paymentId) {
      return res.json({
        saleId: sale._id,
        paymentStatus: sale.paymentStatus || 'pending',
        message: 'El pedido aún no inició el checkout de Payway',
      });
    }

    const payment = await paywayService.resolvePaymentForSale(sale);
    const paymentStatus = paywayService.mapPaywayPaymentStatus(payment?.status);

    if (payment?.id) {
      sale.paymentId = String(payment.id);
      await sale.save();
    }

    await markSalePaid(String(sale._id), paymentStatus);

    res.json({
      saleId: sale._id,
      paymentId: payment?.id ? String(payment.id) : sale.paymentId,
      paywayTransactionId: sale.paywayTransactionId,
      paymentStatus,
      rawStatus: payment?.status,
    });
  } catch (error: any) {
    const message = String(error.message || '');
    const isPending = message.includes('Aún no hay un pago registrado');
    res.status(isPending ? 200 : 400).json({
      message,
      paymentStatus: isPending ? 'pending' : undefined,
    });
  }
};
