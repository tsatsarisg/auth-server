import { Module } from '@nestjs/common';
import UserPostgresRepository from './infra/postgres/user.repository.postgres';
import { USER_REPOSITORY } from './domain/user.repository.interface';
import { UserService } from './application/user.service';
import { PASSWORD_HASHER } from './domain/password.hasher.interface';
import NodePasswordHasher from './infra/password.hasher';

@Module({
  imports: [],
  providers: [
    {
      provide: USER_REPOSITORY,
      useClass: UserPostgresRepository,
    },
    { provide: PASSWORD_HASHER, useClass: NodePasswordHasher },
    UserService,
  ],
  exports: [UserService],
})
export class UserModule {}
