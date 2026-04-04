import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { REFRESH_TOKEN_REPOSITORY, type RefreshTokenRepository } from './ports/refresh-token.repository.js';

@Injectable()
export class TokenCleanupService {
  constructor(
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepo: RefreshTokenRepository,
    @InjectPinoLogger(TokenCleanupService.name)
    private readonly logger: PinoLogger,
  ) {}

  /** Runs daily at 02:00 to purge expired and revoked refresh tokens. */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleCleanup(): Promise<void> {
    this.logger.info('Starting expired/revoked refresh token cleanup');
    try {
      const count = await this.refreshTokenRepo.deleteExpiredAndRevoked();
      this.logger.info({ removedCount: count }, 'Refresh token cleanup completed');
    } catch (e) {
      this.logger.error({ err: e }, 'Refresh token cleanup failed');
    }
  }
}
