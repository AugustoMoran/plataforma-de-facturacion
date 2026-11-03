import request from 'supertest';
import { app } from '../../../app';
import { getMailerConfigStatus } from '../../notifications/services/mailerService';

describe('Store customers auth', () => {
  const customer = {
    name: 'Cliente Tienda',
    email: `cliente-${Date.now()}@test.com`,
    password: 'Password123!',
    phone: '1122334455',
    shippingAddress: {
      street: 'Av. Test 123',
      city: 'Morón',
      province: 'B',
      postalCode: '1708',
      country: 'AR',
    },
  };

  it('registers a public store customer and sets auth cookies', async () => {
    const res = await request(app).post('/api/auth/register/public').send(customer);
    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({
      email: customer.email,
      roles: ['user'],
      emailVerified: false,
    });
    expect(res.body.user.defaultShippingAddress?.postalCode).toBe('1708');
    const cookies = res.get('Set-Cookie');
    expect(cookies).toBeDefined();
  });

  it('exposes mailer configuration status helper', () => {
    const status = getMailerConfigStatus();
    expect(status).toHaveProperty('configured');
  });
});
