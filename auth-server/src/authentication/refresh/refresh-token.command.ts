import { TypedCommand } from '../../common/cqrs/dispatch.js';

export class RefreshTokenCommand extends TypedCommand<{ accessToken: string; refreshToken: string }> {
  constructor(public readonly rawRefreshToken: string) {
    super();
  }
}
