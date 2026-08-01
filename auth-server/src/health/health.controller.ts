import { Controller, Get, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService, HealthCheckResult } from '@nestjs/terminus';
import { HealthIndicatorService } from '@nestjs/terminus';
import { DB_HEALTH_CHECK, type DbHealthCheck } from './db-health-check.js';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly indicator: HealthIndicatorService,
    @Inject(DB_HEALTH_CHECK) private readonly dbCheck: DbHealthCheck,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Application health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  @ApiResponse({ status: 503, description: 'Service is unhealthy' })
  check(): Promise<HealthCheckResult> {
    return this.health.check([
      async () => {
        const indicator = this.indicator.check('database');
        try {
          await this.dbCheck();
          return indicator.up();
        } catch (e) {
          return indicator.down({ message: String(e) });
        }
      },
    ]);
  }
}
