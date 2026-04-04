import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { UserLoggedOutEvent } from './user-logged-out.event.js';

@EventsHandler(UserLoggedOutEvent)
export class UserLoggedOutAuditHandler implements IEventHandler<UserLoggedOutEvent> {
  constructor(
    @InjectPinoLogger(UserLoggedOutAuditHandler.name)
    private readonly logger: PinoLogger,
  ) {}

  handle(event: UserLoggedOutEvent): void {
    this.logger.info({ audit: true, event: 'user_logged_out', userId: event.userId }, 'User logged out');
  }
}
