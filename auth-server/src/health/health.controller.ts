import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService, HealthCheckResult } from '@nestjs/terminus';
import { HealthIndicatorService } from '@nestjs/terminus';
// Lazily-resolved dependencies to avoid importing unavailable database drivers.
// Each check function is set from the module factory so that only the active
// database driver is loaded at runtime.
type DbCheckFn = () => Promise<void>;

@ApiTags('Health')
@Controller('health')
export class HealthController {
  private dbCheck: DbCheckFn | null = null;

  constructor(
    private readonly health: HealthCheckService,
    private readonly indicator: HealthIndicatorService,
  ) {}

  setDatabaseCheck(fn: DbCheckFn): void {
    this.dbCheck = fn;
  }

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Application health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  @ApiResponse({ status: 503, description: 'Service is unhealthy' })
  check(): Promise<HealthCheckResult> {
    const indicators = [];

    if (this.dbCheck) {
      const dbCheck = this.dbCheck;
      indicators.push(async () => {
        const indicator = this.indicator.check('database');
        try {
          await dbCheck();
          return indicator.up();
        } catch (e) {
          return indicator.down({ message: String(e) });
        }
      });
    }

    return this.health.check(indicators);
  }
}
