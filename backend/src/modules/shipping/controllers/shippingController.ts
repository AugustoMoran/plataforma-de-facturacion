import { Request, Response } from 'express';
import * as envioPackService from '../services/envioPackService';
import * as dispatchService from '../services/dispatchService';

export const getProvincesController = async (_req: Request, res: Response) => {
  try {
    res.json(envioPackService.getProvinces());
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getShippingStatusController = async (_req: Request, res: Response) => {
  try {
    res.json({ enabled: envioPackService.isEnvioPackEnabled() });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const quoteShippingController = async (req: Request, res: Response) => {
  try {
    const { postalCode, city, province, items, subtotal } = req.body || {};
    if (!postalCode) {
      return res.status(400).json({ message: 'postalCode es requerido' });
    }
    if (!province) {
      return res.status(400).json({ message: 'province es requerido' });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'items es requerido' });
    }

    const quote = await envioPackService.quoteShipping({
      postalCode: String(postalCode),
      city,
      province: String(province),
      subtotal: Number(subtotal),
      items: items.map((item: any) => ({
        productId: String(item.productId),
        quantity: Number(item.quantity),
      })),
    });
    res.json(quote);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const listDispatchController = async (_req: Request, res: Response) => {
  try {
    const orders = await dispatchService.listDispatchOrders();
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createDispatchController = async (req: Request, res: Response) => {
  try {
    const envio = await dispatchService.createEnvioPackShipmentForSale(req.params.saleId);
    res.json(envio);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const refreshDispatchController = async (req: Request, res: Response) => {
  try {
    const envio = await dispatchService.refreshEnvioPackShipment(req.params.saleId);
    res.json(envio);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const envioPackWebhookController = async (req: Request, res: Response) => {
  try {
    const tipo = String(req.query.tipo || '');
    const id = String(req.query.id || '');
    if (tipo && id) {
      await dispatchService.handleEnvioPackWebhook(tipo, id);
    }
    res.status(200).json({ ok: true });
  } catch {
    res.status(200).json({ ok: true });
  }
};
