import { isAllowedOrigin, normalizeOrigin, parseAllowedOrigins } from '../corsOrigins';

describe('corsOrigins', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('merges CORS_ALLOWED_ORIGINS and FRONTEND_URL', () => {
    process.env.CORS_ALLOWED_ORIGINS = 'https://plataforma-de-facturacion.vercel.app';
    process.env.FRONTEND_URL = 'https://www.ososoundmusic.com/';

    const origins = parseAllowedOrigins();
    expect(origins).toContain('https://www.ososoundmusic.com');
    expect(origins).toContain('https://ososoundmusic.com');
    expect(origins).toContain('https://plataforma-de-facturacion.vercel.app');
  });

  it('allows custom domain and www variant', () => {
    process.env.CORS_ALLOWED_ORIGINS = 'https://plataforma-de-facturacion.vercel.app';
    process.env.FRONTEND_URL = 'https://www.ososoundmusic.com';
    process.env.NODE_ENV = 'production';

    const origins = parseAllowedOrigins();
    expect(isAllowedOrigin('https://www.ososoundmusic.com', origins)).toBe(true);
    expect(isAllowedOrigin('https://ososoundmusic.com', origins)).toBe(true);
    expect(isAllowedOrigin('https://plataforma-de-facturacion.vercel.app', origins)).toBe(true);
    expect(isAllowedOrigin('https://evil.example.com', origins)).toBe(false);
  });

  it('normalizes trailing slashes', () => {
    expect(normalizeOrigin('https://www.ososoundmusic.com/')).toBe('https://www.ososoundmusic.com');
  });
});
