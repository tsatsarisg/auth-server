import { Inject, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { JwtService } from '@nestjs/jwt';
import { err, ok, Result } from 'neverthrow';
import { randomUUID } from 'crypto';
import { ENVS } from '../../config/env.js';
import { REFRESH_TOKEN_REPOSITORY, type RefreshTokenRepository } from './ports/refresh-token.repository.js';
import { AUTH_USER_PORT, type AuthUserPort } from './ports/auth-user.port.js';
import { hashToken, verifyToken } from './token-hasher.js';

const ISS = 'auth-server';
const ALGORITHM = 'HS256' as const;

type TokenPair = { accessToken: string; refreshToken: string };
type AuthError =
  | { type: 'user_not_found' }
  | { type: 'missing_password' }
  | { type: 'invalid_credentials' }
  | { type: 'internal'; message?: string };

@Injectable()
export class AuthService {
  constructor(
    @Inject(AUTH_USER_PORT) private readonly userPort: AuthUserPort,
    private readonly jwtService: JwtService,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepo: RefreshTokenRepository,
    @InjectPinoLogger(AuthService.name)
    private readonly logger: PinoLogger,
  ) {}

  private signAccessToken(payload: Record<string, unknown>): string {
    return this.jwtService.sign(
      { ...payload, type: 'access', iss: ISS },
      {
        secret: ENVS.JWT_SECRET,
        expiresIn: '15m',
        algorithm: ALGORITHM,
      },
    );
  }

  private signRefreshToken(payload: Record<string, unknown>): string {
    return this.jwtService.sign(
      { ...payload, type: 'refresh', iss: ISS },
      {
        secret: ENVS.JWT_REFRESH_SECRET,
        expiresIn: '7d',
        algorithm: ALGORITHM,
      },
    );
  }

  verifyAccessToken(token: string): Record<string, unknown> {
    return this.jwtService.verify(token, {
      secret: ENVS.JWT_SECRET,
      algorithms: [ALGORITHM],
    });
  }

  verifyRefreshToken(token: string): Record<string, unknown> {
    return this.jwtService.verify(token, {
      secret: ENVS.JWT_REFRESH_SECRET,
      algorithms: [ALGORITHM],
    });
  }

  async login(email: string, password: string): Promise<Result<TokenPair, AuthError>> {
    try {
      const user = await this.userPort.findByEmail(email);
      if (!user) {
        this.logger.info({
          event: 'login_failure',
          email,
          reason: 'user_not_found',
        });
        return err({ type: 'user_not_found' });
      }

      const valid = await this.userPort.validateUser(email, password);
      if (!valid) {
        this.logger.info({
          event: 'login_failure',
          email,
          reason: 'invalid_credentials',
        });
        return err({ type: 'invalid_credentials' });
      }

      let accessToken: string;
      let refreshToken: string;
      try {
        accessToken = this.signAccessToken({ sub: user.id, email: user.email });
        const jti = randomUUID();
        const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        refreshToken = this.signRefreshToken({ sub: user.id, jti });
        const hash = hashToken(refreshToken);
        await this.refreshTokenRepo.store(user.id, {
          jti,
          hash,
          expiresAt: refreshExpiresAt,
        });
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : undefined;
        return err({ type: 'internal', message });
      }

      this.logger.info({ event: 'login_success', userId: user.id, email });
      return ok({ accessToken, refreshToken });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : undefined;
      return err({ type: 'internal', message });
    }
  }

  async refresh(
    rawRefreshToken: string,
    onTokenReuse?: (userId: string, jti: string) => void,
  ): Promise<Result<TokenPair, AuthError>> {
    try {
      let payload: Record<string, unknown>;
      try {
        payload = this.verifyRefreshToken(rawRefreshToken);
      } catch {
        return err({ type: 'invalid_credentials' });
      }

      if (payload.type !== 'refresh') {
        return err({ type: 'invalid_credentials' });
      }

      const jti = payload.jti as string | undefined;
      const userId = payload.sub as string | undefined;
      if (!jti || !userId) return err({ type: 'invalid_credentials' });

      const stored = await this.refreshTokenRepo.findByJti(jti);
      if (!stored || stored.revoked || new Date(stored.expiresAt) < new Date()) {
        return err({ type: 'invalid_credentials' });
      }

      const matches = verifyToken(rawRefreshToken, stored.hash);
      if (!matches) {
        this.logger.warn({
          event: 'token_reuse_detected',
          userId: stored.userId,
          jti,
        });
        await this.refreshTokenRepo.revokeAllForUser(stored.userId);
        onTokenReuse?.(stored.userId, jti);
        return err({ type: 'invalid_credentials' });
      }

      await this.refreshTokenRepo.revoke(jti);

      const newJti = randomUUID();
      const newAccessToken = this.signAccessToken({
        sub: userId,
        email: payload.email,
      });
      const newRefreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const newRefreshToken = this.signRefreshToken({
        sub: userId,
        jti: newJti,
      });
      const newHash = hashToken(newRefreshToken);
      await this.refreshTokenRepo.store(userId, {
        jti: newJti,
        hash: newHash,
        expiresAt: newRefreshExpiresAt,
      });

      this.logger.info({ event: 'token_refresh', userId });
      return ok({ accessToken: newAccessToken, refreshToken: newRefreshToken });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : undefined;
      return err({ type: 'internal', message });
    }
  }

  async logout(userId: string): Promise<Result<void, AuthError>> {
    try {
      await this.refreshTokenRepo.revokeAllForUser(userId);
      this.logger.info({ event: 'logout', userId });
      return ok(undefined);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : undefined;
      return err({ type: 'internal', message });
    }
  }
}
