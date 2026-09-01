const API_URL = process.env.ENVIOPACK_API_URL || 'https://api.enviopack.com';

type TokenCache = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
};

let tokenCache: TokenCache | null = null;

const isEnabled = () =>
  process.env.ENVIOPACK_ENABLED !== 'false' &&
  Boolean(process.env.ENVIOPACK_API_KEY && process.env.ENVIOPACK_SECRET_KEY);

export const getEnvioPackDepositId = () => {
  const value = Number(process.env.ENVIOPACK_DEPOSIT_ID || 18048);
  return Number.isFinite(value) ? value : 18048;
};

export const assertEnvioPackConfigured = () => {
  if (!isEnabled()) {
    throw new Error('EnvioPack no está configurado en el servidor');
  }
};

const parseAuthResponse = (data: any): TokenCache => {
  const accessToken = String(data?.access_token || data?.token || '');
  const refreshToken = String(data?.refresh_token || '');
  if (!accessToken) {
    throw new Error('No se pudo autenticar con EnvioPack');
  }
  const expiresIn = Number(data?.expires_in || 4 * 60 * 60);
  return {
    accessToken,
    refreshToken,
    expiresAt: Date.now() + expiresIn * 1000,
  };
};

const authenticate = async () => {
  const body = new URLSearchParams({
    'api-key': process.env.ENVIOPACK_API_KEY || '',
    'secret-key': process.env.ENVIOPACK_SECRET_KEY || '',
  });

  const response = await fetch(`${API_URL}/auth`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || data?.error || 'Error de autenticación con EnvioPack');
  }

  tokenCache = parseAuthResponse(data);
  return tokenCache.accessToken;
};

const refreshAccessToken = async (refreshToken: string) => {
  const response = await fetch(`${API_URL}/token/refresh?refresh_token=${encodeURIComponent(refreshToken)}`, {
    method: 'POST',
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    tokenCache = null;
    return authenticate();
  }
  tokenCache = parseAuthResponse(data);
  return tokenCache.accessToken;
};

export const getAccessToken = async () => {
  assertEnvioPackConfigured();
  if (tokenCache && Date.now() < tokenCache.expiresAt - 60_000) {
    return tokenCache.accessToken;
  }
  if (tokenCache?.refreshToken) {
    return refreshAccessToken(tokenCache.refreshToken);
  }
  return authenticate();
};

const request = async <T>(
  method: 'GET' | 'POST' | 'PUT',
  path: string,
  options?: { params?: Record<string, string | number | boolean | undefined | null>; body?: unknown }
): Promise<T> => {
  const token = await getAccessToken();
  const url = new URL(`${API_URL}${path}`);
  url.searchParams.set('access_token', token);
  Object.entries(options?.params || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    url.searchParams.set(key, String(value));
  });

  const response = await fetch(url, {
    method,
    headers: options?.body ? { 'content-type': 'application/json' } : undefined,
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      (Array.isArray(data) ? undefined : data?.errors?.[0]) ||
      `EnvioPack respondió ${response.status}`;
    throw new Error(message);
  }

  return data as T;
};

export const envioPackGet = <T>(path: string, params?: Record<string, string | number | boolean | undefined | null>) =>
  request<T>('GET', path, { params });

export const envioPackPost = <T>(path: string, body: unknown) => request<T>('POST', path, { body });

export const envioPackPut = <T>(path: string, body: unknown) => request<T>('PUT', path, { body });
