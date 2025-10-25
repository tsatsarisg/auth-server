import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { EncryptorModule } from './modules/encryptor/encryptor.module';

@Module({
  imports: [DatabaseModule, EncryptorModule, AuthModule, UserModule],
})
export class AppModule {}
