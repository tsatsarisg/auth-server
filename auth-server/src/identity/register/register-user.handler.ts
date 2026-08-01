import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { ok, type Result } from 'neverthrow';
import { RegisterUserCommand } from './register-user.command.js';
import { UserRegisteredEvent } from './user-registered.event.js';
import { UserService } from '../shared/user.service.js';
import { EmailAlreadyInUseError } from '../shared/ports/user.repository.js';
import { tryCatch } from '../../common/errors/try-catch.js';
import { type AppError } from '../../common/errors/app-error.js';

@CommandHandler(RegisterUserCommand)
export class RegisterUserHandler implements ICommandHandler<RegisterUserCommand> {
  constructor(
    private readonly users: UserService,
    private readonly eventBus: EventBus,
  ) {}

  execute(command: RegisterUserCommand): Promise<Result<{ message: string }, AppError>> {
    return tryCatch(
      async () => {
        await this.users.create(command.email, command.password);
        this.eventBus.publish(new UserRegisteredEvent(command.email));
        return ok({ message: 'User registered successfully' });
      },
      // The email unique constraint is the authoritative duplicate check;
      // a pre-insert existence lookup would just race against it.
      (e) => (e instanceof EmailAlreadyInUseError ? { code: 'CONFLICT', resource: 'user' } : null),
    );
  }
}
