import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { err, ok, type Result } from 'neverthrow';
import { RefreshTokenCommand } from './refresh-token.command.js';
import { RefreshTokenReusedEvent } from './refresh-token-reused.event.js';
import { TokenService, type RefreshTokenClaims } from '../shared/token.service.js';
import { TokenIssuer, type TokenPair } from '../shared/token-issuer.js';
import { REFRESH_TOKEN_REPOSITORY, type RefreshTokenRepository } from '../shared/ports/refresh-token.repository.js';
import { verifyToken } from '../shared/token-hasher.js';
import { tryCatch } from '../../common/errors/try-catch.js';
import { type AppError } from '../../common/errors/app-error.js';

@CommandHandler(RefreshTokenCommand)
export class RefreshTokenHandler implements ICommandHandler<RefreshTokenCommand> {
  constructor(
    @Inject(REFRESH_TOKEN_REPOSITORY) private readonly refreshTokenRepo: RefreshTokenRepository,
    private readonly tokenService: TokenService,
    private readonly tokenIssuer: TokenIssuer,
    private readonly eventBus: EventBus,
    @InjectPinoLogger(RefreshTokenHandler.name) private readonly logger: PinoLogger,
  ) {}

  execute(command: RefreshTokenCommand): Promise<Result<TokenPair, AppError>> {
    return tryCatch(async () => {
      const { rawRefreshToken } = command;

      let claims: RefreshTokenClaims;
      try {
        claims = this.tokenService.verifyRefreshToken(rawRefreshToken);
      } catch {
        return err({ code: 'UNAUTHORIZED', reason: 'invalid_token' });
      }

      const claimed = await this.refreshTokenRepo.claim(claims.jti);
      if (!claimed) {
        // A signature-valid token whose jti is known but already revoked is a
        // replayed (rotated) token: revoke the user's whole session family.
        const stored = await this.refreshTokenRepo.findByJti(claims.jti);
        if (stored?.revoked) {
          return this.handleReuse(stored.userId, claims.jti);
        }
        return err({ code: 'UNAUTHORIZED', reason: 'unknown_token' });
      }

      if (new Date(claimed.expiresAt) < new Date()) {
        return err({ code: 'UNAUTHORIZED', reason: 'token_expired' });
      }

      if (!verifyToken(rawRefreshToken, claimed.hash)) {
        // Defense in depth: a signed token whose jti maps to a different hash.
        return this.handleReuse(claimed.userId, claims.jti);
      }

      const tokens = await this.tokenIssuer.issueTokenPair(claimed.userId, claims.email);
      this.logger.info({ event: 'token_refresh', userId: claimed.userId });
      return ok(tokens);
    });
  }

  private async handleReuse(userId: string, jti: string): Promise<Result<TokenPair, AppError>> {
    this.logger.warn({ event: 'token_reuse_detected', userId, jti });
    await this.refreshTokenRepo.revokeAllForUser(userId);
    this.eventBus.publish(new RefreshTokenReusedEvent(userId, jti));
    return err({ code: 'UNAUTHORIZED', reason: 'token_reuse' });
  }
}
