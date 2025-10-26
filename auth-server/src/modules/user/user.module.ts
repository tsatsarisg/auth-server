import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from './infra/mongo/schemas/user.schema';
import UserMongoRepository from './infra/mongo/user.repository.mongo';
import { USER_REPOSITORY } from './domain/user.repository.interface';
import { UserService } from './application/user.service';
import { PASSWORD_HASHER } from './domain/password.hasher.interface';
import NodePasswordHasher from './infra/password.hasher';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'User', schema: UserSchema }])],
  providers: [
    {
      provide: USER_REPOSITORY,
      useClass: UserMongoRepository,
    },
    { provide: PASSWORD_HASHER, useClass: NodePasswordHasher },
    UserService,
  ],
  exports: [],
})
export class UserModule {}
