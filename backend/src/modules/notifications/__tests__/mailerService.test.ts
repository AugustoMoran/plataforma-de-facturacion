import { getMailerConfigStatus, resetMailerCacheForTests } from '../services/mailerService';

describe('mailerService', () => {
  afterEach(() => {
    resetMailerCacheForTests();
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_FROM;
  });

  it('reports not configured when SMTP_HOST is missing', () => {
    const status = getMailerConfigStatus();
    expect(status.configured).toBe(false);
  });

  it('reports configured when SMTP env vars are present', () => {
    process.env.SMTP_HOST = 'smtp.test.com';
    process.env.SMTP_FROM = 'test@example.com';
    resetMailerCacheForTests();
    const status = getMailerConfigStatus();
    expect(status.configured).toBe(true);
    expect(status.from).toBe('test@example.com');
  });
});
