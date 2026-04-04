import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { CqrsModule } from '@nestjs/cqrs';
import { MongooseModule } from '@nestjs/mongoose';

import { IdentityModule } from '../identity/identity.module.js';
import { UserService } from '../identity/shared/identity.service.js';
import { UserSchema } from '../identity/shared/adapters/mongo/schemas/user.schema.js';
import { TokenService } from './shared/token.service.js';
import { AuthController } from './shared/auth.controller.js';
import { REFRESH_TOKEN_REPOSITORY } from './shared/ports/refresh-token.repository.js';
import { AUTH_USER_PORT } from './shared/ports/auth-user.port.js';
import { RefreshTokenPostgresRepository } from './shared/adapters/postgres/refresh-token.repository.postgres.js';
import { RefreshTokenMongoRepository } from './shared/adapters/mongo/refresh-token.repository.mongo.js';
import { TokenCleanupService } from './shared/token-cleanup.service.js';
import { ENVS } from '../config/env.js';

import { RegisterUserHandler } from './register/register-user.handler.js';
import { LoginHandler } from './login/login.handler.js';
import { RefreshTokenHandler } from './refresh/refresh-token.handler.js';
import { LogoutHandler } from './logout/logout.handler.js';

import { UserRegisteredAuditHandler } from './register/user-registered.audit-handler.js';
import { LoginSucceededAuditHandler } from './login/login-succeeded.audit-handler.js';
import { LoginFailedAuditHandler } from './login/login-failed.audit-handler.js';
import { RefreshTokenReusedAuditHandler } from './refresh/refresh-token-reused.audit-handler.js';
import { UserLoggedOutAuditHandler } from './logout/user-logged-out.audit-handler.js';

const isPostgres = ENVS.DB_PROVIDER === 'postgres';

const CommandHandlers = [RegisterUserHandler, LoginHandler, RefreshTokenHandler, LogoutHandler];

const EventHandlers = [
  UserRegisteredAuditHandler,
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
    ...(isPostgres ? [] : [MongooseModule.forFeature([{ name: 'User', schema: UserSchema }])]),
  ],
  providers: [
    TokenService,
    {
      provide: REFRESH_TOKEN_REPOSITORY,
      useClass: isPostgres ? RefreshTokenPostgresRepository : RefreshTokenMongoRepository,
    },
    {
      provide: AUTH_USER_PORT,
      useExisting: UserService,
    },
    ...CommandHandlers,
    ...EventHandlers,
    TokenCleanupService,
  ],
  controllers: [AuthController],
})
export class AuthenticationModule {}
