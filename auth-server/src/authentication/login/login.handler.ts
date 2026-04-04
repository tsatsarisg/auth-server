import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { UnauthorizedException } from '@nestjs/common';
import { LoginCommand } from './login.command.js';
import { AuthService } from '../shared/auth.service.js';
import { LoginSucceededEvent } from './login-succeeded.event.js';
import { LoginFailedEvent } from './login-failed.event.js';

@CommandHandler(LoginCommand)
export class LoginHandler implements ICommandHandler<LoginCommand> {
  constructor(
    private readonly authService: AuthService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(
    command: LoginCommand,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const { email, password } = command;
    const result = await this.authService.login(email, password);

    if (result.isErr()) {
      const error = result.error;
      this.eventBus.publish(new LoginFailedEvent(email, error.type));
      if (
        error.type === 'user_not_found' ||
        error.type === 'invalid_credentials'
      ) {
        throw new UnauthorizedException('Invalid email or password');
      }
      throw new UnauthorizedException('Login failed');
    }

    this.eventBus.publish(new LoginSucceededEvent(email));
    return result.value;
  }
}
