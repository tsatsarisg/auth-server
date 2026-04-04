import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { UnauthorizedException } from '@nestjs/common';
import { LogoutCommand } from './logout.command.js';
import { AuthService } from '../shared/auth.service.js';
import { UserLoggedOutEvent } from './user-logged-out.event.js';

@CommandHandler(LogoutCommand)
export class LogoutHandler implements ICommandHandler<LogoutCommand> {
  constructor(
    private readonly authService: AuthService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: LogoutCommand): Promise<{ message: string }> {
    const result = await this.authService.logout(command.userId);

    if (result.isErr()) {
      throw new UnauthorizedException('Logout failed');
    }

    this.eventBus.publish(new UserLoggedOutEvent(command.userId));
    return { message: 'Logged out successfully' };
  }
}
