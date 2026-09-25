import request from 'supertest';
import { createApp } from '../../src/app.js';
import { memoryDb } from '../../src/config/database.js';

describe('Authentication & RBAC Integration Tests', () => {
  let app;

  beforeEach(() => {
    memoryDb.reset();
    app = createApp();
  });

  test('POST /api/auth/login successfully sets HttpOnly cookie for valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'student@dcrust.ac.in',
        password: 'Student@123',
        role: 'STUDENT',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('student@dcrust.ac.in');
    expect(res.body.data.user.role).toBe('STUDENT');
    expect(res.body.data.user.passwordHash).toBeUndefined();

    // Verify Set-Cookie header contains HttpOnly cookie
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies.some(c => c.includes('dcrust_auth_token') && c.includes('HttpOnly'))).toBe(true);
  });

  test('POST /api/auth/login rejects incorrect password with 401 and standard error code', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'student@dcrust.ac.in',
        password: 'WrongPassword!',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('AUTH_INVALID_CREDENTIALS');
  });

  test('GET /api/auth/me returns session when HttpOnly cookie is present', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'student@dcrust.ac.in', password: 'Student@123' });

    const cookie = loginRes.headers['set-cookie'];

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Cookie', cookie);

    expect(meRes.status).toBe(200);
    expect(meRes.body.success).toBe(true);
    expect(meRes.body.data.user.name).toBe('Rahul Sharma');
  });

  test('RBAC: Student accessing Admin route is rejected with 403 Forbidden', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'student@dcrust.ac.in', password: 'Student@123' });

    const cookie = loginRes.headers['set-cookie'];

    const adminRes = await request(app)
      .get('/api/admin/audit')
      .set('Cookie', cookie);

    expect(adminRes.status).toBe(403);
    expect(adminRes.body.success).toBe(false);
    expect(adminRes.body.code).toBe('AUTH_FORBIDDEN');
  });

  test('GET /api/health returns status ok without sensitive info', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.database).toBe('degraded');
    expect(res.body.timestamp).toBeDefined();
  });
});
