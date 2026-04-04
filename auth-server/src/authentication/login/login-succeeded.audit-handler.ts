import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { LoginSucceededEvent } from './login-succeeded.event.js';

@EventsHandler(LoginSucceededEvent)
export class LoginSucceededAuditHandler implements IEventHandler<LoginSucceededEvent> {
  constructor(
    @InjectPinoLogger(LoginSucceededAuditHandler.name)
    private readonly logger: PinoLogger,
  ) {}

  handle(event: LoginSucceededEvent): void {
    this.logger.info({ audit: true, event: 'login_succeeded', email: event.email }, 'Login succeeded');
  }
}
