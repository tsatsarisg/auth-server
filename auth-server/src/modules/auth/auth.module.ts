import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';

import { UserModule } from '../user/user.module';
import { UserService } from '../user/application/user.service';
import { UserSchema } from '../user/infra/mongo/schemas/user.schema';
import { AuthService } from './application/auth.service';
import { AuthController } from './presentation/auth.controller';
import { REFRESH_TOKEN_REPOSITORY } from './domain/refresh-token.repository.interface';
import { AUTH_USER_PORT } from './domain/auth-user.port';
import { RefreshTokenPostgresRepository } from './infra/postgres/refresh-token.repository.postgres';
import { RefreshTokenMongoRepository } from './infra/mongo/refresh-token.repository.mongo';
import { ENVS } from '../../config/env';

const isPostgres = ENVS.DB_PROVIDER === 'postgres';

@Module({
  imports: [
    UserModule,
    JwtModule.register({}),
    ...(isPostgres
      ? []
      : [MongooseModule.forFeature([{ name: 'User', schema: UserSchema }])]),
  ],
  providers: [
    AuthService,
    {
      provide: REFRESH_TOKEN_REPOSITORY,
      useClass: isPostgres
        ? RefreshTokenPostgresRepository
        : RefreshTokenMongoRepository,
    },
    {
      provide: AUTH_USER_PORT,
      useExisting: UserService,
    },
  ],
  controllers: [AuthController],
})
export class AuthModule {}
