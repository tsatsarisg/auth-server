import { Module } from '@nestjs/common';
import { PASSWORD_HASHER } from './domain/password.hasher.interface';
import NodePasswordHasher from './infrastructure/password.hasher';
import { UserModule } from '../user/user.module';

@Module({
  imports: [UserModule],
  providers: [{ provide: PASSWORD_HASHER, useClass: NodePasswordHasher }],
  exports: [PASSWORD_HASHER],
})
export class AuthModule {}
