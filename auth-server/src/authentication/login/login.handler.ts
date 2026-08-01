import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { err, ok, type Result } from 'neverthrow';
import { LoginCommand } from './login.command.js';
import { LoginSucceededEvent } from './login-succeeded.event.js';
import { LoginFailedEvent } from './login-failed.event.js';
import { TokenIssuer, type TokenPair } from '../shared/token-issuer.js';
import { AUTH_USER_PORT, type AuthUserPort } from '../shared/ports/auth-user.port.js';
import { tryCatch } from '../../common/errors/try-catch.js';
import { type AppError } from '../../common/errors/app-error.js';

@CommandHandler(LoginCommand)
export class LoginHandler implements ICommandHandler<LoginCommand> {
  constructor(
    @Inject(AUTH_USER_PORT) private readonly userPort: AuthUserPort,
    private readonly tokenIssuer: TokenIssuer,
    private readonly eventBus: EventBus,
    @InjectPinoLogger(LoginHandler.name) private readonly logger: PinoLogger,
  ) {}

  execute(command: LoginCommand): Promise<Result<TokenPair, AppError>> {
    return tryCatch(async () => {
      const { email, password } = command;

      const user = await this.userPort.verifyCredentials(email, password);
      if (!user) {
        this.logger.info({ event: 'login_failure', email, reason: 'invalid_credentials' });
        this.eventBus.publish(new LoginFailedEvent(email, 'invalid_credentials'));
        return err({ code: 'UNAUTHORIZED' });
      }

      const tokens = await this.tokenIssuer.issueTokenPair(user.id, user.email);
      this.logger.info({ event: 'login_success', userId: user.id, email });
      this.eventBus.publish(new LoginSucceededEvent(email));
      return ok(tokens);
    });
  }
}
