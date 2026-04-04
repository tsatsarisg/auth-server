import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { err, ok, type Result } from 'neverthrow';
import { RegisterUserCommand } from './register-user.command.js';
import { AUTH_USER_PORT, type AuthUserPort } from '../shared/ports/auth-user.port.js';
import { UserRegisteredEvent } from './user-registered.event.js';
import { type AppError } from '../../common/errors/app-error.js';

@CommandHandler(RegisterUserCommand)
export class RegisterUserHandler implements ICommandHandler<RegisterUserCommand> {
  constructor(
    @Inject(AUTH_USER_PORT) private readonly userPort: AuthUserPort,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: RegisterUserCommand): Promise<Result<{ message: string }, AppError>> {
    const { email, password } = command;

    try {
      const existingUser = await this.userPort.findByEmail(email);
      if (existingUser) return err({ code: 'CONFLICT', resource: 'user' });

      await this.userPort.create(email, password);
      this.eventBus.publish(new UserRegisteredEvent(email));
      return ok({ message: 'User registered successfully' });
    } catch (e) {
      const message = e instanceof Error ? e.message : undefined;
      return err({ code: 'INTERNAL_ERROR', message });
    }
  }
}
