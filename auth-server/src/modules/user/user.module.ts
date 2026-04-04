import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserPostgresRepository } from './infra/postgres/user.repository.postgres';
import { UserMongoRepository } from './infra/mongo/user.repository.mongo';
import { USER_REPOSITORY } from './domain/user.repository.interface';
import { UserService } from './application/user.service';
import { PASSWORD_HASHER } from './domain/password.hasher.interface';
import { NodePasswordHasher } from './infra/password.hasher';
import { UserSchema } from './infra/mongo/schemas/user.schema';
import { ENVS } from '../../config/env';

const isPostgres = ENVS.DB_PROVIDER === 'postgres';

@Module({
  imports: [
    ...(isPostgres
      ? []
      : [MongooseModule.forFeature([{ name: 'User', schema: UserSchema }])]),
  ],
  providers: [
    {
      provide: USER_REPOSITORY,
      useClass: isPostgres ? UserPostgresRepository : UserMongoRepository,
    },
    { provide: PASSWORD_HASHER, useClass: NodePasswordHasher },
    UserService,
  ],
  exports: [UserService],
})
export class UserModule {}
