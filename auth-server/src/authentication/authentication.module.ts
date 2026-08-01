import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { CqrsModule } from '@nestjs/cqrs';
import { MongooseModule } from '@nestjs/mongoose';

import { IdentityModule } from '../identity/index.js';
import { TokenService } from './shared/token.service.js';
import { TokenIssuer } from './shared/token-issuer.js';
import { AuthController } from './shared/auth.controller.js';
import { AUTH_USER_PORT } from './shared/ports/auth-user.port.js';
import { IdentityAuthUserAdapter } from './shared/adapters/identity-auth-user.adapter.js';
import { REFRESH_TOKEN_REPOSITORY } from './shared/ports/refresh-token.repository.js';
import { RefreshTokenPostgresRepository } from './shared/adapters/postgres/refresh-token.repository.postgres.js';
import { RefreshTokenMongoRepository } from './shared/adapters/mongo/refresh-token.repository.mongo.js';
import { RefreshTokenSchema } from './shared/adapters/mongo/schemas/refresh-token.schema.js';
import { TokenCleanupService } from './shared/token-cleanup.service.js';
import { ENVS } from '../config/env.js';

import { LoginHandler } from './login/login.handler.js';
import { RefreshTokenHandler } from './refresh/refresh-token.handler.js';
import { LogoutHandler } from './logout/logout.handler.js';

import { LoginSucceededAuditHandler } from './login/login-succeeded.audit-handler.js';
import { LoginFailedAuditHandler } from './login/login-failed.audit-handler.js';
import { RefreshTokenReusedAuditHandler } from './refresh/refresh-token-reused.audit-handler.js';
import { UserLoggedOutAuditHandler } from './logout/user-logged-out.audit-handler.js';

const isPostgres = ENVS.DB_PROVIDER === 'postgres';

const CommandHandlers = [LoginHandler, RefreshTokenHandler, LogoutHandler];

const EventHandlers = [
  LoginSucceededAuditHandler,
  LoginFailedAuditHandler,
  RefreshTokenReusedAuditHandler,
  UserLoggedOutAuditHandler,
];

@Module({
  imports: [
    CqrsModule,
    IdentityModule,
    JwtModule.register({}),
    ...(isPostgres ? [] : [MongooseModule.forFeature([{ name: 'RefreshToken', schema: RefreshTokenSchema }])]),
  ],
  providers: [
    TokenService,
    TokenIssuer,
    {
      provide: REFRESH_TOKEN_REPOSITORY,
      useClass: isPostgres ? RefreshTokenPostgresRepository : RefreshTokenMongoRepository,
    },
    {
      provide: AUTH_USER_PORT,
      useClass: IdentityAuthUserAdapter,
    },
    ...CommandHandlers,
    ...EventHandlers,
    TokenCleanupService,
  ],
  controllers: [AuthController],
})
export class AuthenticationModule {}
