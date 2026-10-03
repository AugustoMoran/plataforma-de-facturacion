import crypto from 'crypto';

export type CustomerShippingAddress = {
  street?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  country?: string;
};

export const normalizeCustomerAddress = (input?: CustomerShippingAddress | null) => {
  if (!input) return undefined;
  const street = String(input.street || '').trim();
  const city = String(input.city || '').trim();
  const province = String(input.province || '').trim();
  const postalCode = String(input.postalCode || '').replace(/\D/g, '').slice(0, 4);
  const country = String(input.country || 'AR').trim() || 'AR';

  if (!street && !city && !province && !postalCode) return undefined;

  return { street, city, province, postalCode, country };
};

export const isCustomerRole = (roles: string[] = []) => {
  const normalized = roles.map((r) => String(r).toLowerCase());
  const isStaff = normalized.some((r) => r === 'admin' || r === 'vendedor');
  return normalized.includes('user') && !isStaff;
};

export const createEmailVerificationToken = () => {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return { token, tokenHash, expiresAt };
};

export const hashEmailVerificationToken = (token: string) =>
  crypto.createHash('sha256').update(String(token || '').trim()).digest('hex');
