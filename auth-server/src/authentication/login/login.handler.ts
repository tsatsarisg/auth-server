import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { err, ok, type Result } from 'neverthrow';
import { randomUUID } from 'crypto';
import { LoginCommand } from './login.command.js';
import { LoginSucceededEvent } from './login-succeeded.event.js';
import { LoginFailedEvent } from './login-failed.event.js';
import { TokenService } from '../shared/token.service.js';
import { REFRESH_TOKEN_REPOSITORY, type RefreshTokenRepository } from '../shared/ports/refresh-token.repository.js';
import { AUTH_USER_PORT, type AuthUserPort } from '../shared/ports/auth-user.port.js';
import { hashToken } from '../shared/token-hasher.js';
import { type AppError } from '../../common/errors/app-error.js';

type TokenPair = { accessToken: string; refreshToken: string };

@CommandHandler(LoginCommand)
export class LoginHandler implements ICommandHandler<LoginCommand> {
  constructor(
    @Inject(AUTH_USER_PORT) private readonly userPort: AuthUserPort,
    @Inject(REFRESH_TOKEN_REPOSITORY) private readonly refreshTokenRepo: RefreshTokenRepository,
    private readonly tokenService: TokenService,
    private readonly eventBus: EventBus,
    @InjectPinoLogger(LoginHandler.name) private readonly logger: PinoLogger,
  ) {}

  async execute(command: LoginCommand): Promise<Result<TokenPair, AppError>> {
    const { email, password } = command;

    try {
      const user = await this.userPort.findByEmail(email);
      if (!user) {
        this.logger.info({ event: 'login_failure', email, reason: 'not_found' });
        this.eventBus.publish(new LoginFailedEvent(email, 'not_found'));
        return err({ code: 'UNAUTHORIZED' });
      }

      const valid = await this.userPort.validateUser(email, password);
      if (!valid) {
        this.logger.info({ event: 'login_failure', email, reason: 'invalid_credentials' });
        this.eventBus.publish(new LoginFailedEvent(email, 'invalid_credentials'));
        return err({ code: 'UNAUTHORIZED' });
      }

      const accessToken = this.tokenService.signAccessToken({ sub: user.id, email: user.email });
      const jti = randomUUID();
      const refreshToken = this.tokenService.signRefreshToken({ sub: user.id, jti });
      await this.refreshTokenRepo.store(user.id, {
        jti,
        hash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      this.logger.info({ event: 'login_success', userId: user.id, email });
      this.eventBus.publish(new LoginSucceededEvent(email));
      return ok({ accessToken, refreshToken });
    } catch (e) {
      const message = e instanceof Error ? e.message : undefined;
      return err({ code: 'INTERNAL_ERROR', message });
    }
  }
}
