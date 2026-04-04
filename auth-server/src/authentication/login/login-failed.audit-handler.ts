import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { LoginFailedEvent } from './login-failed.event.js';

@EventsHandler(LoginFailedEvent)
export class LoginFailedAuditHandler implements IEventHandler<LoginFailedEvent> {
  constructor(
    @InjectPinoLogger(LoginFailedAuditHandler.name)
    private readonly logger: PinoLogger,
  ) {}

  handle(event: LoginFailedEvent): void {
    this.logger.warn(
      {
        audit: true,
        event: 'login_failed',
        email: event.email,
        reason: event.reason,
      },
      'Login failed',
    );
  }
}
