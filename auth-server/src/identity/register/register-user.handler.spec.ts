import { type EventBus } from '@nestjs/cqrs';
import { RegisterUserHandler } from './register-user.handler.js';
import { RegisterUserCommand } from './register-user.command.js';
import { UserRegisteredEvent } from './user-registered.event.js';
import { type UserService } from '../shared/user.service.js';
import { EmailAlreadyInUseError } from '../shared/ports/user.repository.js';

describe('RegisterUserHandler', () => {
  let users: { create: jest.Mock };
  let eventBus: { publish: jest.Mock };
  let handler: RegisterUserHandler;

  beforeEach(() => {
    users = { create: jest.fn() };
    eventBus = { publish: jest.fn() };
    handler = new RegisterUserHandler(users as unknown as UserService, eventBus as unknown as EventBus);
  });

  it('creates the user and publishes UserRegisteredEvent', async () => {
    users.create.mockResolvedValue(undefined);

    const result = await handler.execute(new RegisterUserCommand('a@b.com', 'password1234'));

    expect(result._unsafeUnwrap()).toEqual({ message: 'User registered successfully' });
    expect(users.create).toHaveBeenCalledWith('a@b.com', 'password1234');
    expect(eventBus.publish).toHaveBeenCalledWith(new UserRegisteredEvent('a@b.com'));
  });

  it('maps a unique-constraint violation to CONFLICT', async () => {
    users.create.mockRejectedValue(new EmailAlreadyInUseError());

    const result = await handler.execute(new RegisterUserCommand('a@b.com', 'password1234'));

    expect(result._unsafeUnwrapErr()).toEqual({ code: 'CONFLICT', resource: 'user' });
    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  it('maps unexpected failures to INTERNAL_ERROR without publishing an event', async () => {
    users.create.mockRejectedValue(new Error('db down'));

    const result = await handler.execute(new RegisterUserCommand('a@b.com', 'password1234'));

    expect(result._unsafeUnwrapErr()).toEqual({ code: 'INTERNAL_ERROR', message: 'db down' });
    expect(eventBus.publish).not.toHaveBeenCalled();
  });
});
