import request from 'supertest';
import { app } from '../../../app';
import { User } from '../models/User';
import { backfillMemberCodes, getNextMemberCode, MEMBER_CODE_START } from '../services/memberCodeService';

describe('Código de socio (memberCode)', () => {
  const admin = { email: 'admin@oso.test', password: 'Password123!' };

  const customerPayload = (email: string) => ({
    name: 'Socio Test',
    email,
    password: 'Password123!',
    phone: '1122334455',
    shippingAddress: {
      street: 'Av. Test 123',
      city: 'CABA',
      province: 'C',
      postalCode: '1414',
      country: 'AR',
    },
  });

  it('asigna 100 al primer usuario y expone el código en el registro', async () => {
    const res = await request(app).post('/api/auth/register').send(admin);
    expect(res.status).toBe(200);
    expect(res.body.memberCode).toBe(MEMBER_CODE_START); // 100
  });

  it('el registro público de socio recibe código y es autoincremental', async () => {
    await request(app).post('/api/auth/register').send(admin); // admin -> 100

    const r1 = await request(app)
      .post('/api/auth/register/public')
      .send(customerPayload(`c1-${Date.now()}@test.com`));
    expect(r1.status).toBe(201);
    expect(r1.body.user.memberCode).toBe(101);

    const r2 = await request(app)
      .post('/api/auth/register/public')
      .send(customerPayload(`c2-${Date.now()}@test.com`));
    expect(r2.status).toBe(201);
    expect(r2.body.user.memberCode).toBe(102);
  });

  it('los códigos de socio son únicos', async () => {
    await request(app).post('/api/auth/register').send(admin);
    for (let i = 0; i < 4; i++) {
      await request(app)
        .post('/api/auth/register/public')
        .send(customerPayload(`bulk${i}-${Date.now()}@test.com`));
    }
    const codes = (await User.find().select('memberCode')).map((u) => u.memberCode);
    expect(new Set(codes).size).toBe(codes.length);
    expect(Math.min(...(codes as number[]))).toBe(MEMBER_CODE_START);
  });

  it('el customer recibe su código serializado en /me', async () => {
    await request(app).post('/api/auth/register').send(admin);
    const email = `me-${Date.now()}@test.com`;
    const reg = await request(app).post('/api/auth/register/public').send(customerPayload(email));
    const cookies = (reg.get('Set-Cookie') as unknown as string[] | undefined) || [];
    const accessCookie = cookies.map((c) => c.split(';')[0]).filter((c) => c.startsWith('accessToken='));

    const me = await request(app).get('/api/auth/me').set('Cookie', accessCookie);
    expect(me.status).toBe(200);
    expect(me.body.memberCode).toBe(101);
  });

  it('backfill asigna códigos a usuarios sin código, respetando el orden de creación', async () => {
    const u1 = await User.create({ name: 'Legacy 1', email: 'l1@test.com', password: 'x', roles: ['user'] });
    const u2 = await User.create({ name: 'Legacy 2', email: 'l2@test.com', password: 'x', roles: ['user'] });
    expect(u1.memberCode).toBeUndefined();

    const assigned = await backfillMemberCodes();
    expect(assigned).toBe(2);

    const r1 = await User.findById(u1._id);
    const r2 = await User.findById(u2._id);
    expect(r1?.memberCode).toBe(100);
    expect(r2?.memberCode).toBe(101);

    const next = await getNextMemberCode();
    expect(next).toBe(102);
  });
});
