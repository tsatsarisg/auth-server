import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from './infra/mongo/schemas/user.schema';
import UserMongoRepository from './infra/mongo/user.repository.mongo';
import { USER_REPOSITORY } from './domain/user.repository.interface';
import { UserService } from './application/user.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'User', schema: UserSchema }])],
  providers: [
    {
      provide: USER_REPOSITORY,
      useClass: UserMongoRepository,
    },
    UserService,
  ],
  exports: [USER_REPOSITORY],
})
export class UserModule {}
