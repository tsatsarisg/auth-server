import { Global, Module } from '@nestjs/common';
import Encryptor from './encryptor';
import ENVS from 'src/config/env';

@Global()
@Module({
  providers: [
    {
      provide: Encryptor,
      useFactory: () => new Encryptor(ENVS.ENCRYPTION_KEY_BASE64),
    },
  ],
  exports: [Encryptor],
})
export class EncryptorModule {}
