import { ISale } from '../../sales/models/Sale';

export const PAYMENT_PENDING_HOURS = 24;

export const getPaymentExpiresAt = (createdAt = new Date()) => {
  const expiresAt = new Date(createdAt);
  expiresAt.setHours(expiresAt.getHours() + PAYMENT_PENDING_HOURS);
  return expiresAt;
};

export const isPaymentRetryExpired = (sale: Pick<ISale, 'paymentExpiresAt' | 'createdAt'>) => {
  const expiresAt = sale.paymentExpiresAt || getPaymentExpiresAt(sale.createdAt);
  return Date.now() > expiresAt.getTime();
};

export const canRetryPaywayPayment = (sale: Pick<ISale, 'paymentStatus' | 'paymentMethod' | 'paymentExpiresAt' | 'createdAt' | 'status'>) => {
  if (sale.status === 'CANCELLED') return false;
  if (sale.paymentMethod !== 'payway') return false;
  if (sale.paymentStatus === 'approved') return false;
  if (isPaymentRetryExpired(sale)) return false;
  return ['pending', 'rejected'].includes(String(sale.paymentStatus || 'pending'));
};
