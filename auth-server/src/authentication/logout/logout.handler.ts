import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { err, ok, type Result } from 'neverthrow';
import { LogoutCommand } from './logout.command.js';
import { UserLoggedOutEvent } from './user-logged-out.event.js';
import { REFRESH_TOKEN_REPOSITORY, type RefreshTokenRepository } from '../shared/ports/refresh-token.repository.js';
import { type AppError } from '../../common/errors/app-error.js';

@CommandHandler(LogoutCommand)
export class LogoutHandler implements ICommandHandler<LogoutCommand> {
  constructor(
    @Inject(REFRESH_TOKEN_REPOSITORY) private readonly refreshTokenRepo: RefreshTokenRepository,
    private readonly eventBus: EventBus,
    @InjectPinoLogger(LogoutHandler.name) private readonly logger: PinoLogger,
  ) {}

  async execute(command: LogoutCommand): Promise<Result<{ message: string }, AppError>> {
    try {
      await this.refreshTokenRepo.revokeAllForUser(command.userId);
      this.logger.info({ event: 'logout', userId: command.userId });
      this.eventBus.publish(new UserLoggedOutEvent(command.userId));
      return ok({ message: 'Logged out successfully' });
    } catch (e) {
      const message = e instanceof Error ? e.message : undefined;
      return err({ code: 'INTERNAL_ERROR', message });
    }
  }
}
