import { TypedCommand } from '../../common/cqrs/dispatch.js';

export class LoginCommand extends TypedCommand<{ accessToken: string; refreshToken: string }> {
  constructor(
    public readonly email: string,
    public readonly password: string,
  ) {
    super();
  }
}
