import { JwtService } from '@nestjs/jwt';
import { type EventBus } from '@nestjs/cqrs';
import { type PinoLogger } from 'nestjs-pino';
import { RefreshTokenHandler } from './refresh-token.handler.js';
import { RefreshTokenCommand } from './refresh-token.command.js';
import { RefreshTokenReusedEvent } from './refresh-token-reused.event.js';
import { TokenService } from '../shared/token.service.js';
import { TokenIssuer } from '../shared/token-issuer.js';
import { hashToken } from '../shared/token-hasher.js';
import { InMemoryRefreshTokenRepository } from '../shared/adapters/in-memory/refresh-token.repository.in-memory.js';

const USER_ID = 'user-1';
const EMAIL = 'user@example.com';

describe('RefreshTokenHandler', () => {
  let repo: InMemoryRefreshTokenRepository;
  let tokenService: TokenService;
  let issuer: TokenIssuer;
  let eventBus: { publish: jest.Mock };
  let handler: RefreshTokenHandler;

  const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() } as unknown as PinoLogger;

  beforeEach(() => {
    repo = new InMemoryRefreshTokenRepository();
    tokenService = new TokenService(new JwtService({}));
    issuer = new TokenIssuer(tokenService, repo);
    eventBus = { publish: jest.fn() };
    handler = new RefreshTokenHandler(repo, tokenService, issuer, eventBus as unknown as EventBus, logger);
  });

  async function issueValidToken(): Promise<{ refreshToken: string; jti: string }> {
    const { refreshToken } = await issuer.issueTokenPair(USER_ID, EMAIL);
    const { jti } = tokenService.verifyRefreshToken(refreshToken);
    return { refreshToken, jti };
  }

  it('rotates a valid token: new pair issued, old jti revoked, email claim preserved', async () => {
    const { refreshToken, jti } = await issueValidToken();

    const result = await handler.execute(new RefreshTokenCommand(refreshToken));

    expect(result.isOk()).toBe(true);
    const pair = result._unsafeUnwrap();
    expect(tokenService.verifyAccessToken(pair.accessToken)).toMatchObject({ sub: USER_ID, email: EMAIL });
    const newClaims = tokenService.verifyRefreshToken(pair.refreshToken);
    expect(newClaims).toMatchObject({ sub: USER_ID, email: EMAIL });
    expect(newClaims.jti).not.toBe(jti);

    const oldStored = await repo.findByJti(jti);
    expect(oldStored?.revoked).toBe(true);
    const newStored = await repo.findByJti(newClaims.jti);
    expect(newStored?.revoked).toBe(false);
  });

  it('treats a replayed (already-rotated) token as reuse: revokes the whole family and publishes the event', async () => {
    const { refreshToken, jti } = await issueValidToken();

    const first = await handler.execute(new RefreshTokenCommand(refreshToken));
    const rotated = first._unsafeUnwrap();

    const replay = await handler.execute(new RefreshTokenCommand(refreshToken));

    expect(replay.isErr()).toBe(true);
    expect(replay._unsafeUnwrapErr()).toEqual({ code: 'UNAUTHORIZED', reason: 'token_reuse' });
    expect(eventBus.publish).toHaveBeenCalledWith(new RefreshTokenReusedEvent(USER_ID, jti));

    // The token minted by the legitimate rotation must be dead too.
    const rotatedJti = tokenService.verifyRefreshToken(rotated.refreshToken).jti;
    expect((await repo.findByJti(rotatedJti))?.revoked).toBe(true);
    const secondRotation = await handler.execute(new RefreshTokenCommand(rotated.refreshToken));
    expect(secondRotation._unsafeUnwrapErr()).toEqual({ code: 'UNAUTHORIZED', reason: 'token_reuse' });
  });

  it('lets exactly one of two concurrent refreshes win; the loser triggers the reuse cascade', async () => {
    const { refreshToken } = await issueValidToken();
    const command = new RefreshTokenCommand(refreshToken);

    const [a, b] = await Promise.all([handler.execute(command), handler.execute(command)]);

    const outcomes = [a, b];
    expect(outcomes.filter((r) => r.isOk())).toHaveLength(1);
    const loser = outcomes.find((r) => r.isErr());
    expect(loser?._unsafeUnwrapErr()).toEqual({ code: 'UNAUTHORIZED', reason: 'token_reuse' });
    expect(eventBus.publish).toHaveBeenCalledTimes(1);
  });

  it('rejects an expired token without starting a rotation', async () => {
    const jti = 'expired-jti';
    const refreshToken = tokenService.signRefreshToken({ sub: USER_ID, jti, email: EMAIL });
    await repo.store(USER_ID, { jti, hash: hashToken(refreshToken), expiresAt: new Date(Date.now() - 1000) });

    const result = await handler.execute(new RefreshTokenCommand(refreshToken));

    expect(result._unsafeUnwrapErr()).toEqual({ code: 'UNAUTHORIZED', reason: 'token_expired' });
    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  it('rejects a signed token whose jti was never stored, without a revocation cascade', async () => {
    const refreshToken = tokenService.signRefreshToken({ sub: USER_ID, jti: 'ghost-jti', email: EMAIL });

    const result = await handler.execute(new RefreshTokenCommand(refreshToken));

    expect(result._unsafeUnwrapErr()).toEqual({ code: 'UNAUTHORIZED', reason: 'unknown_token' });
    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  it('rejects garbage input as UNAUTHORIZED, not INTERNAL_ERROR', async () => {
    const result = await handler.execute(new RefreshTokenCommand('not-a-jwt'));
    expect(result._unsafeUnwrapErr()).toEqual({ code: 'UNAUTHORIZED', reason: 'invalid_token' });
  });

  it('rejects an access token presented as a refresh token', async () => {
    const accessToken = tokenService.signAccessToken({ sub: USER_ID, email: EMAIL });
    const result = await handler.execute(new RefreshTokenCommand(accessToken));
    expect(result._unsafeUnwrapErr()).toEqual({ code: 'UNAUTHORIZED', reason: 'invalid_token' });
  });

  it('rejects a legacy refresh token missing the email claim with 401 semantics, not a 500', async () => {
    const legacyToken = new JwtService({}).sign(
      { sub: USER_ID, jti: 'legacy-jti', type: 'refresh', iss: 'auth-server' },
      { secret: process.env.JWT_REFRESH_SECRET, expiresIn: 60 },
    );

    const result = await handler.execute(new RefreshTokenCommand(legacyToken));

    expect(result._unsafeUnwrapErr()).toEqual({ code: 'UNAUTHORIZED', reason: 'invalid_token' });
  });
});
