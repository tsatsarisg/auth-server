import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { LoggerModule } from 'nestjs-pino';
import { randomUUID } from 'crypto';
import { DrizzleModule } from './database/drizzle.module.js';
import { DatabaseModule } from './database/database.module.js';
import { IdentityModule } from './identity/identity.module.js';
import { AuthenticationModule } from './authentication/authentication.module.js';
import { EncryptionModule } from './encryption/encryption.module.js';
import { HealthModule } from './health/health.module.js';
import { ENVS } from './config/env.js';
import type { IncomingMessage } from 'http';

const dbModule =
  ENVS.DB_PROVIDER === 'postgres' ? DrizzleModule : DatabaseModule;

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        genReqId: (req: IncomingMessage) => {
          const existing = req.headers['x-request-id'];
          if (typeof existing === 'string' && existing.length > 0) {
            return existing;
          }
          return randomUUID();
        },
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { singleLine: true } }
            : undefined,
        level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
      },
    }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,
        limit: 30,
      },
    ]),
    ScheduleModule.forRoot(),
    dbModule,
    EncryptionModule,
    AuthenticationModule,
    IdentityModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
