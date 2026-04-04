import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { err, ok, type Result } from 'neverthrow';
import { randomUUID } from 'crypto';
import { RefreshTokenCommand } from './refresh-token.command.js';
import { RefreshTokenReusedEvent } from './refresh-token-reused.event.js';
import { TokenService } from '../shared/token.service.js';
import { REFRESH_TOKEN_REPOSITORY, type RefreshTokenRepository } from '../shared/ports/refresh-token.repository.js';
import { hashToken, verifyToken } from '../shared/token-hasher.js';
import { type AppError } from '../../common/errors/app-error.js';

type TokenPair = { accessToken: string; refreshToken: string };

@CommandHandler(RefreshTokenCommand)
export class RefreshTokenHandler implements ICommandHandler<RefreshTokenCommand> {
  constructor(
    @Inject(REFRESH_TOKEN_REPOSITORY) private readonly refreshTokenRepo: RefreshTokenRepository,
    private readonly tokenService: TokenService,
    private readonly eventBus: EventBus,
    @InjectPinoLogger(RefreshTokenHandler.name) private readonly logger: PinoLogger,
  ) {}

  async execute(command: RefreshTokenCommand): Promise<Result<TokenPair, AppError>> {
    const { rawRefreshToken } = command;

    try {
      let payload: Record<string, unknown>;
      try {
        payload = this.tokenService.verifyRefreshToken(rawRefreshToken);
      } catch {
        return err({ code: 'UNAUTHORIZED', reason: 'invalid_token' });
      }

      if (payload.type !== 'refresh') return err({ code: 'UNAUTHORIZED', reason: 'invalid_token_type' });

      const jti = payload.jti as string | undefined;
      const userId = payload.sub as string | undefined;
      if (!jti || !userId) return err({ code: 'UNAUTHORIZED', reason: 'malformed_token' });

      const stored = await this.refreshTokenRepo.findByJti(jti);
      if (!stored || stored.revoked || new Date(stored.expiresAt) < new Date()) {
        return err({ code: 'UNAUTHORIZED', reason: 'token_expired_or_revoked' });
      }

      if (!verifyToken(rawRefreshToken, stored.hash)) {
        this.logger.warn({ event: 'token_reuse_detected', userId: stored.userId, jti });
        await this.refreshTokenRepo.revokeAllForUser(stored.userId);
        this.eventBus.publish(new RefreshTokenReusedEvent(stored.userId, jti));
        return err({ code: 'UNAUTHORIZED', reason: 'token_reuse' });
      }

      await this.refreshTokenRepo.revoke(jti);

      const newJti = randomUUID();
      const accessToken = this.tokenService.signAccessToken({ sub: userId, email: payload.email });
      const refreshToken = this.tokenService.signRefreshToken({ sub: userId, jti: newJti });
      await this.refreshTokenRepo.store(userId, {
        jti: newJti,
        hash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      this.logger.info({ event: 'token_refresh', userId });
      return ok({ accessToken, refreshToken });
    } catch (e) {
      const message = e instanceof Error ? e.message : undefined;
      return err({ code: 'INTERNAL_ERROR', message });
    }
  }
}
