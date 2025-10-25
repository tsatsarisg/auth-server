import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import ENVS from './config/env';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(ENVS.PORT);
}
void bootstrap();
