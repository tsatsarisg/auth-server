import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ENVS } from '../config/env';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: ENVS.MONGO_URI,
        // In production you may want to set autoIndex: false
      }),
      inject: [],
    }),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}
