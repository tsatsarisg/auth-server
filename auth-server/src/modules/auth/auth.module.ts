import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { UserModule } from '../user/user.module';
import ENVS from '../../config/env';
import AuthService from './application/auth.service';
import { AuthController } from './presentation/auth.controller';

@Module({
  imports: [
    UserModule,
    JwtModule.register({
      secret: ENVS.JWT_SECRET,
      signOptions: {},
    }),
  ],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
