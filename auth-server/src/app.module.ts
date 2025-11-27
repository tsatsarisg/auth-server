import { Module } from '@nestjs/common';
import { DrizzleModule } from './database/drizzle.module';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { EncryptorModule } from './modules/encryptor/encryptor.module';

@Module({
  imports: [DrizzleModule, EncryptorModule, AuthModule, UserModule],
})
export class AppModule {}
