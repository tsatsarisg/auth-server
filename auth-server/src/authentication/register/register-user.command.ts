import { TypedCommand } from '../../common/cqrs/dispatch.js';

export class RegisterUserCommand extends TypedCommand<{ message: string }> {
  constructor(
    public readonly email: string,
    public readonly password: string,
  ) {
    super();
  }
}
