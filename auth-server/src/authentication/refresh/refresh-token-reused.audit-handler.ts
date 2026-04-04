import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { RefreshTokenReusedEvent } from './refresh-token-reused.event.js';

@EventsHandler(RefreshTokenReusedEvent)
export class RefreshTokenReusedAuditHandler
  implements IEventHandler<RefreshTokenReusedEvent>
{
  constructor(
    @InjectPinoLogger(RefreshTokenReusedAuditHandler.name)
    private readonly logger: PinoLogger,
  ) {}

  handle(event: RefreshTokenReusedEvent): void {
    this.logger.warn(
      {
        audit: true,
        event: 'refresh_token_reused',
        userId: event.userId,
        jti: event.jti,
      },
      'Refresh token reuse detected — all tokens revoked for user',
    );
  }
}
