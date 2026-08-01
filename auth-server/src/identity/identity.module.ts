import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { MongooseModule } from '@nestjs/mongoose';
import { UserPostgresRepository } from './shared/adapters/postgres/user.repository.postgres.js';
import { UserPostgresMapper } from './shared/adapters/postgres/user.mapper.postgres.js';
import { UserMongoRepository } from './shared/adapters/mongo/user.repository.mongo.js';
import { UserMongoMapper } from './shared/adapters/mongo/user.mapper.js';
import { USER_REPOSITORY } from './shared/ports/user.repository.js';
import { UserService } from './shared/user.service.js';
import { PASSWORD_HASHER } from './shared/ports/password-hasher.js';
import { NodePasswordHasher } from './shared/adapters/scrypt-password-hasher.js';
import { UserSchema } from './shared/adapters/mongo/schemas/user.schema.js';
import { RegisterUserHandler } from './register/register-user.handler.js';
import { UserRegisteredAuditHandler } from './register/user-registered.audit-handler.js';
import { ENVS } from '../config/env.js';

const isPostgres = ENVS.DB_PROVIDER === 'postgres';

@Module({
  imports: [CqrsModule, ...(isPostgres ? [] : [MongooseModule.forFeature([{ name: 'User', schema: UserSchema }])])],
  providers: [
    {
      provide: USER_REPOSITORY,
      useClass: isPostgres ? UserPostgresRepository : UserMongoRepository,
    },
    isPostgres ? UserPostgresMapper : UserMongoMapper,
    { provide: PASSWORD_HASHER, useClass: NodePasswordHasher },
    UserService,
    RegisterUserHandler,
    UserRegisteredAuditHandler,
  ],
  exports: [UserService],
})
export class IdentityModule {}
