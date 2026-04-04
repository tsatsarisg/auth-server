import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { MongooseModule } from '@nestjs/mongoose';
import { UserPostgresRepository } from './shared/adapters/postgres/user.repository.postgres.js';
import { UserMongoRepository } from './shared/adapters/mongo/user.repository.mongo.js';
import { USER_REPOSITORY } from './shared/ports/user.repository.js';
import { UserService } from './shared/identity.service.js';
import { PASSWORD_HASHER } from './shared/ports/password-hasher.js';
import { NodePasswordHasher } from './shared/adapters/scrypt-password-hasher.js';
import { UserSchema } from './shared/adapters/mongo/schemas/user.schema.js';
import { FindUserByEmailHandler } from './find-user-by-email/find-user-by-email.handler.js';
import { AUTH_USER_PORT } from '../authentication/shared/ports/auth-user.port.js';
import { ENVS } from '../config/env.js';

const isPostgres = ENVS.DB_PROVIDER === 'postgres';

@Module({
  imports: [CqrsModule, ...(isPostgres ? [] : [MongooseModule.forFeature([{ name: 'User', schema: UserSchema }])])],
  providers: [
    {
      provide: USER_REPOSITORY,
      useClass: isPostgres ? UserPostgresRepository : UserMongoRepository,
    },
    { provide: PASSWORD_HASHER, useClass: NodePasswordHasher },
    UserService,
    { provide: AUTH_USER_PORT, useExisting: UserService },
    FindUserByEmailHandler,
  ],
  exports: [AUTH_USER_PORT],
})
export class IdentityModule {}
