const stripTrailingSlash = (value: string) => value.trim().replace(/\/+$/, '');

export const normalizeOrigin = (value: string) => {
  const trimmed = stripTrailingSlash(value);
  if (!trimmed) return '';

  try {
    return new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`).origin.toLowerCase();
  } catch {
    return trimmed.toLowerCase();
  }
};

const addWwwVariants = (origin: string, bucket: Set<string>) => {
  if (!origin || origin.includes('*')) return;

  let hostname = '';
  try {
    hostname = new URL(origin).hostname;
  } catch {
    return;
  }

  bucket.add(origin);

  if (hostname.startsWith('www.')) {
    bucket.add(`${new URL(origin).protocol}//${hostname.slice(4)}`);
  } else {
    bucket.add(`${new URL(origin).protocol}//www.${hostname}`);
  }
};

export const parseAllowedOrigins = () => {
  const rawValues = [
    process.env.CORS_ALLOWED_ORIGINS || '',
    process.env.FRONTEND_URL || '',
  ]
    .join(',')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  const normalized = new Set<string>();

  rawValues.forEach((value) => {
    if (value.includes('*')) {
      normalized.add(value);
      return;
    }
    addWwwVariants(normalizeOrigin(value), normalized);
  });

  return Array.from(normalized).filter(Boolean);
};

export const isAllowedOrigin = (origin?: string, allowedOrigins: string[] = parseAllowedOrigins()) => {
  if (!origin) return true;
  if (!allowedOrigins.length) return true;

  const normalizedOrigin = normalizeOrigin(origin);
  let originUrl: URL | null = null;
  try {
    originUrl = new URL(normalizedOrigin);
  } catch {
    originUrl = null;
  }

  if (process.env.NODE_ENV !== 'production' && originUrl) {
    if (originUrl.hostname === 'localhost' || originUrl.hostname === '127.0.0.1') {
      return true;
    }
  }

  return allowedOrigins.some((allowed) => {
    const normalizedAllowed = normalizeOrigin(allowed);

    if (normalizedAllowed.startsWith('*.')) {
      const domain = normalizedAllowed.slice(1);
      return Boolean(originUrl?.hostname.endsWith(domain));
    }

    const protocolWildcardMatch = normalizedAllowed.match(/^(https?):\/\/\*\.(.+)$/);
    if (protocolWildcardMatch && originUrl) {
      const [, protocol, domain] = protocolWildcardMatch;
      return originUrl.protocol === `${protocol}:` && originUrl.hostname.endsWith(`.${domain}`);
    }

    return normalizedOrigin === normalizedAllowed;
  });
};
