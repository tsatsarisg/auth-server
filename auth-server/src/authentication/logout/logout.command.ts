import { TypedCommand } from '../../common/cqrs/dispatch.js';

export class LogoutCommand extends TypedCommand<{ message: string }> {
  constructor(public readonly userId: string) {
    super();
  }
}
