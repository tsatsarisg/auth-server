import { Test } from '@nestjs/testing';
import { type INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { USER_REPOSITORY } from '../src/identity/shared/ports/user.repository.js';
import { REFRESH_TOKEN_REPOSITORY } from '../src/authentication/shared/ports/refresh-token.repository.js';
import { DB_HEALTH_CHECK } from '../src/health/db-health-check.js';
import { InMemoryUserRepository } from '../src/identity/shared/adapters/in-memory/user.repository.in-memory.js';
import { InMemoryRefreshTokenRepository } from '../src/authentication/shared/adapters/in-memory/refresh-token.repository.in-memory.js';

const EMAIL = 'Test.User@Example.COM';
const PASSWORD = 'a-strong-password-123';

function refreshCookie(res: request.Response): string {
  const header = res.headers['set-cookie'];
  const cookies: string[] = Array.isArray(header) ? header : [header as unknown as string];
  const cookie = cookies.find((c) => c.startsWith('refresh_token='));
  if (!cookie) throw new Error('refresh_token cookie not set');
  return cookie.split(';')[0]!;
}

describe('Authentication lifecycle (e2e, in-memory adapters)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(USER_REPOSITORY)
      .useValue(new InMemoryUserRepository())
      .overrideProvider(REFRESH_TOKEN_REPOSITORY)
      .useValue(new InMemoryRefreshTokenRepository())
      .overrideProvider(DB_HEALTH_CHECK)
      .useValue(() => Promise.resolve())
      .compile();

    app = moduleRef.createNestApplication({ logger: false });
    app.use(cookieParser());
    app.setGlobalPrefix('api/v1', { exclude: ['health'] });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('reports healthy', async () => {
    await request(app.getHttpServer()).get('/health').expect(200);
  });

  it('rejects registration with an invalid payload', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: 'not-an-email', password: 'short' })
      .expect(400);
  });

  it('runs the full lifecycle: register, conflict, login, rotate, replay-detect, cascade-revoke, logout', async () => {
    const server = app.getHttpServer();

    // Register
    await request(server).post('/api/v1/auth/register').send({ email: EMAIL, password: PASSWORD }).expect(201);

    // Duplicate registration with different casing → conflict (normalization + unique constraint)
    await request(server)
      .post('/api/v1/auth/register')
      .send({ email: EMAIL.toLowerCase(), password: PASSWORD })
      .expect(409);

    // Wrong password → 401
    await request(server).post('/api/v1/auth/login').send({ email: EMAIL, password: 'wrong-password-123' }).expect(401);

    // Login with a differently-cased email → tokens issued
    const login = await request(server)
      .post('/api/v1/auth/login')
      .send({ email: EMAIL.toUpperCase(), password: PASSWORD })
      .expect(201);
    expect(login.body.accessToken).toBeDefined();
    const cookie1 = refreshCookie(login);
    expect(login.headers['set-cookie']![0]).toMatch(/HttpOnly/i);
    expect(login.headers['set-cookie']![0]).toMatch(/Path=\/api\/v1\/auth/i);

    // Rotate the refresh token
    const rotated = await request(server).post('/api/v1/auth/refresh').set('Cookie', cookie1).expect(201);
    expect(rotated.body.accessToken).toBeDefined();
    const cookie2 = refreshCookie(rotated);
    expect(cookie2).not.toBe(cookie1);

    // Replay the rotated cookie → reuse detected
    await request(server).post('/api/v1/auth/refresh').set('Cookie', cookie1).expect(401);

    // The reuse cascade must have revoked the legitimate successor too
    await request(server).post('/api/v1/auth/refresh').set('Cookie', cookie2).expect(401);

    // Fresh login, then logout revokes and clears the cookie
    const relogin = await request(server)
      .post('/api/v1/auth/login')
      .send({ email: EMAIL, password: PASSWORD })
      .expect(201);
    const cookie3 = refreshCookie(relogin);
    const logout = await request(server)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${relogin.body.accessToken}`)
      .expect(201);
    expect(logout.headers['set-cookie']![0]).toMatch(/refresh_token=;/);

    // The logged-out session's refresh token is dead
    await request(server).post('/api/v1/auth/refresh').set('Cookie', cookie3).expect(401);
  });
});
