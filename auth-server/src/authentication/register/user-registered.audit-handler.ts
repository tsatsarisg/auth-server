import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { UserRegisteredEvent } from './user-registered.event.js';

@EventsHandler(UserRegisteredEvent)
export class UserRegisteredAuditHandler
  implements IEventHandler<UserRegisteredEvent>
{
  constructor(
    @InjectPinoLogger(UserRegisteredAuditHandler.name)
    private readonly logger: PinoLogger,
  ) {}

  handle(event: UserRegisteredEvent): void {
    this.logger.info(
      { audit: true, event: 'user_registered', email: event.email },
      'User registered',
    );
  }
}
