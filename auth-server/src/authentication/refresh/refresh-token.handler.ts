import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { UnauthorizedException } from '@nestjs/common';
import { RefreshTokenCommand } from './refresh-token.command.js';
import { AuthService } from '../shared/auth.service.js';
import { RefreshTokenReusedEvent } from './refresh-token-reused.event.js';

@CommandHandler(RefreshTokenCommand)
export class RefreshTokenHandler
  implements ICommandHandler<RefreshTokenCommand>
{
  constructor(
    private readonly authService: AuthService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(
    command: RefreshTokenCommand,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const result = await this.authService.refresh(
      command.rawRefreshToken,
      (userId: string, jti: string) => {
        this.eventBus.publish(new RefreshTokenReusedEvent(userId, jti));
      },
    );

    if (result.isErr()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    return result.value;
  }
}
