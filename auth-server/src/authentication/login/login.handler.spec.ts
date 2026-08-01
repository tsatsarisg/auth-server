import { JwtService } from '@nestjs/jwt';
import { type EventBus } from '@nestjs/cqrs';
import { type PinoLogger } from 'nestjs-pino';
import { LoginHandler } from './login.handler.js';
import { LoginCommand } from './login.command.js';
import { LoginFailedEvent } from './login-failed.event.js';
import { LoginSucceededEvent } from './login-succeeded.event.js';
import { type AuthUserPort } from '../shared/ports/auth-user.port.js';
import { TokenService } from '../shared/token.service.js';
import { TokenIssuer } from '../shared/token-issuer.js';
import { InMemoryRefreshTokenRepository } from '../shared/adapters/in-memory/refresh-token.repository.in-memory.js';

describe('LoginHandler', () => {
  let repo: InMemoryRefreshTokenRepository;
  let tokenService: TokenService;
  let userPort: { verifyCredentials: jest.Mock };
  let eventBus: { publish: jest.Mock };
  let handler: LoginHandler;

  const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() } as unknown as PinoLogger;

  beforeEach(() => {
    repo = new InMemoryRefreshTokenRepository();
    tokenService = new TokenService(new JwtService({}));
    userPort = { verifyCredentials: jest.fn() };
    eventBus = { publish: jest.fn() };
    handler = new LoginHandler(
      userPort as unknown as AuthUserPort,
      new TokenIssuer(tokenService, repo),
      eventBus as unknown as EventBus,
      logger,
    );
  });

  it('returns UNAUTHORIZED and publishes LoginFailedEvent when credentials do not match', async () => {
    userPort.verifyCredentials.mockResolvedValue(null);

    const result = await handler.execute(new LoginCommand('a@b.com', 'wrong-password'));

    expect(result._unsafeUnwrapErr()).toEqual({ code: 'UNAUTHORIZED' });
    expect(eventBus.publish).toHaveBeenCalledWith(new LoginFailedEvent('a@b.com', 'invalid_credentials'));
  });

  it('issues a token pair and stores the refresh token on success', async () => {
    userPort.verifyCredentials.mockResolvedValue({ id: 'user-1', email: 'a@b.com' });

    const result = await handler.execute(new LoginCommand('a@b.com', 'correct-password'));

    const pair = result._unsafeUnwrap();
    expect(tokenService.verifyAccessToken(pair.accessToken)).toMatchObject({ sub: 'user-1', email: 'a@b.com' });
    const refreshClaims = tokenService.verifyRefreshToken(pair.refreshToken);
    expect(refreshClaims).toMatchObject({ sub: 'user-1', email: 'a@b.com' });
    expect((await repo.findByJti(refreshClaims.jti))?.revoked).toBe(false);
    expect(eventBus.publish).toHaveBeenCalledWith(new LoginSucceededEvent('a@b.com'));
  });

  it('maps unexpected port failures to INTERNAL_ERROR instead of throwing', async () => {
    userPort.verifyCredentials.mockRejectedValue(new Error('db down'));

    const result = await handler.execute(new LoginCommand('a@b.com', 'password'));

    expect(result._unsafeUnwrapErr()).toEqual({ code: 'INTERNAL_ERROR', message: 'db down' });
  });
});
