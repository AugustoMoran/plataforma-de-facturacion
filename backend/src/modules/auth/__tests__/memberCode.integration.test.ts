import request from 'supertest';
import { app } from '../../../app';
import { User } from '../models/User';
import { backfillMemberCodes, getNextMemberCode, MEMBER_CODE_START } from '../services/memberCodeService';

const getCookieHeader = (res: request.Response): string[] => {
  const raw = res.get('Set-Cookie') as unknown as string[] | undefined;
  return (raw || []).map((c) => c.split(';')[0]);
};

describe('Member code (código de socio)', () => {
  const admin = { email: 'admin@example.com', password: 'Password123!' };

  const registerAsAdmin = async () => {
    await request(app).post('/api/auth/register').send(admin);
    const login = await request(app).post('/api/auth/login').send(admin);
    return getCookieHeader(login);
  };

  it('starts member codes at 100 and increments by 1', async () => {
    const first = await request(app).post('/api/auth/register').send(admin);
    expect(first.status).toBe(200);
    expect(first.body.memberCode).toBe(MEMBER_CODE_START); // 100

    const login = await request(app).post('/api/auth/login').send(admin);
    const cookies = getCookieHeader(login);

    const second = await request(app)
      .post('/api/auth/register')
      .set('Cookie', cookies)
      .send({ email: 'socio2@example.com', password: 'Password123!' });
    expect(second.body.memberCode).toBe(101);

    const third = await request(app)
      .post('/api/auth/register')
      .set('Cookie', cookies)
      .send({ email: 'socio3@example.com', password: 'Password123!' });
    expect(third.body.memberCode).toBe(102);
  });

  it('persists phone/address and exposes all data via /users', async () => {
    const cookies = await registerAsAdmin();

    await request(app)
      .post('/api/auth/register')
      .set('Cookie', cookies)
      .send({
        email: 'contacto@example.com',
        password: 'Password123!',
        name: 'Juan Pérez',
        phone: '+54 9 11 5555-1234',
        address: 'Av. Siempre Viva 742, CABA',
      });

    const list = await request(app).get('/api/auth/users').set('Cookie', cookies);
    expect(list.status).toBe(200);

    const juan = list.body.find((u: any) => u.email === 'contacto@example.com');
    expect(juan).toBeTruthy();
    expect(juan.memberCode).toBe(101);
    expect(juan.name).toBe('Juan Pérez');
    expect(juan.phone).toBe('+54 9 11 5555-1234');
    expect(juan.address).toBe('Av. Siempre Viva 742, CABA');
    // El endpoint no debe filtrar datos sensibles
    expect(juan.password).toBeUndefined();
  });

  it('member codes are unique across many users', async () => {
    const cookies = await registerAsAdmin();
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/auth/register')
        .set('Cookie', cookies)
        .send({ email: `bulk${i}@example.com`, password: 'Password123!' });
    }
    const codes = (await User.find().select('memberCode')).map((u) => u.memberCode);
    const unique = new Set(codes);
    expect(unique.size).toBe(codes.length);
    expect(Math.min(...(codes as number[]))).toBe(MEMBER_CODE_START);
  });

  it('admin can update profile (name/phone/address)', async () => {
    const cookies = await registerAsAdmin();
    const created = await request(app)
      .post('/api/auth/register')
      .set('Cookie', cookies)
      .send({ email: 'editable@example.com', password: 'Password123!' });

    const userId = created.body.id;
    const upd = await request(app)
      .patch('/api/auth/users/profile')
      .set('Cookie', cookies)
      .send({ userId, name: 'Nuevo Nombre', phone: '12345', address: 'Calle 1' });

    expect(upd.status).toBe(200);
    expect(upd.body.user.phone).toBe('12345');
    expect(upd.body.user.address).toBe('Calle 1');
    expect(upd.body.user.name).toBe('Nuevo Nombre');
  });

  it('backfill assigns codes to users missing one, respecting creation order', async () => {
    // Usuarios legacy creados directamente sin memberCode
    const u1 = await User.create({ name: 'Legacy 1', email: 'legacy1@example.com', password: 'x', roles: ['user'] });
    const u2 = await User.create({ name: 'Legacy 2', email: 'legacy2@example.com', password: 'x', roles: ['user'] });

    expect(u1.memberCode).toBeUndefined();

    const assigned = await backfillMemberCodes();
    expect(assigned).toBe(2);

    const r1 = await User.findById(u1._id);
    const r2 = await User.findById(u2._id);
    expect(r1?.memberCode).toBe(100);
    expect(r2?.memberCode).toBe(101);

    // El siguiente código continúa la secuencia
    const next = await getNextMemberCode();
    expect(next).toBe(102);
  });
});
