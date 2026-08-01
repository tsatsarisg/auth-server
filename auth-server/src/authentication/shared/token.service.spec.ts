import { JwtService } from '@nestjs/jwt';
import { TokenService } from './token.service.js';

describe('TokenService', () => {
  const service = new TokenService(new JwtService({}));

  it('round-trips access token claims', () => {
    const token = service.signAccessToken({ sub: 'user-1', email: 'a@b.com' });
    expect(service.verifyAccessToken(token)).toMatchObject({ sub: 'user-1', email: 'a@b.com' });
  });

  it('round-trips refresh token claims including the jti', () => {
    const token = service.signRefreshToken({ sub: 'user-1', jti: 'jti-1', email: 'a@b.com' });
    expect(service.verifyRefreshToken(token)).toMatchObject({ sub: 'user-1', jti: 'jti-1', email: 'a@b.com' });
  });

  it('rejects a refresh token presented as an access token (separate secrets)', () => {
    const refresh = service.signRefreshToken({ sub: 'user-1', jti: 'jti-1', email: 'a@b.com' });
    expect(() => service.verifyAccessToken(refresh)).toThrow();
  });

  it('rejects a signature-valid token whose type claim is wrong (schema check)', () => {
    const forged = new JwtService({}).sign(
      { sub: 'user-1', email: 'a@b.com', type: 'refresh', iss: 'auth-server' },
      { secret: process.env.JWT_SECRET, expiresIn: 60 },
    );
    expect(() => service.verifyAccessToken(forged)).toThrow();
  });

  it('rejects a signature-valid access token missing required claims', () => {
    const missingEmail = new JwtService({}).sign(
      { sub: 'user-1', type: 'access', iss: 'auth-server' },
      { secret: process.env.JWT_SECRET, expiresIn: 60 },
    );
    expect(() => service.verifyAccessToken(missingEmail)).toThrow();
  });

  it('rejects tampered tokens', () => {
    const token = service.signAccessToken({ sub: 'user-1', email: 'a@b.com' });
    expect(() => service.verifyAccessToken(token.slice(0, -3) + 'abc')).toThrow();
  });
});
