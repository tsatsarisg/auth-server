import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { ENVS } from './config/env';

// TLS requirements:
// - In production, this server MUST run behind a TLS-terminating reverse proxy
//   (e.g. nginx, AWS ALB, Cloudflare) so that all traffic is encrypted in transit.
// - Set TRUST_PROXY to the number of trusted proxy hops (e.g. "1") or a comma-
//   separated list of trusted proxy IPs so Express correctly reads X-Forwarded-*
//   headers for secure cookies, rate limiting by real IP, and HSTS enforcement.
// - Helmet enables HSTS by default (Strict-Transport-Security header), which
//   instructs browsers to only connect over HTTPS for subsequent requests.

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.enableShutdownHooks();

  if (ENVS.TRUST_PROXY) {
    const proxy = /^\d+$/.test(ENVS.TRUST_PROXY)
      ? Number(ENVS.TRUST_PROXY)
      : ENVS.TRUST_PROXY;
    app.getHttpAdapter().getInstance().set('trust proxy', proxy);
  }

  app.use(helmet());
  app.use(cookieParser());

  const allowedOrigins = ENVS.ALLOWED_ORIGINS
    ? ENVS.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    : [];

  app.enableCors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : false,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  await app.listen(ENVS.PORT);
}
void bootstrap();
