import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import {
  ConflictException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { RegisterUserCommand } from './register-user.command.js';
import { AUTH_USER_PORT, type AuthUserPort } from '../shared/ports/auth-user.port.js';
import { UserService } from '../../identity/shared/identity.service.js';
import { UserRegisteredEvent } from './user-registered.event.js';

@CommandHandler(RegisterUserCommand)
export class RegisterUserHandler
  implements ICommandHandler<RegisterUserCommand>
{
  constructor(
    @Inject(AUTH_USER_PORT) private readonly userPort: AuthUserPort,
    private readonly userService: UserService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: RegisterUserCommand): Promise<{ message: string }> {
    const { email, password } = command;

    const existingUser = await this.userPort.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    try {
      await this.userService.create({ email, password });
      this.eventBus.publish(new UserRegisteredEvent(email));
      return { message: 'User registered successfully' };
    } catch {
      throw new BadRequestException('Failed to register user');
    }
  }
}
