import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user/current-user.decorator';
import { Roles } from '../../auth/decorators/roles/roles.decorator';
import { UserRole } from '../../auth/entities/user.entity/user.entity';
import type { AuthenticatedUser } from '../../auth/strategies/jwt.strategy/jwt.strategy';
import { ListCertificateAlertsDto } from '../dto/certificate.dto/certificate.dto';
import { CertificateAlertsService } from './certificate-alerts.service';

@ApiTags('Certificate alerts')
@ApiBearerAuth('access-token')
@Controller('certificate-alerts')
export class CertificateAlertsController {
  constructor(private readonly alerts: CertificateAlertsService) {}

  @Post('run')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({
    summary: 'Generate due certificate alerts idempotently',
    description:
      'Creates one alert per certificate and alert type. Exact expiry is EXPIRED; expiration in at most 30 days is EXPIRING_30_DAYS.',
    operationId: 'runCertificateAlerts',
  })
  run() {
    return this.alerts.run();
  }

  @Get()
  @ApiOperation({
    summary: 'List permitted certificate alerts',
    operationId: 'listCertificateAlerts',
  })
  list(
    @Query() query: ListCertificateAlertsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.alerts.list(query, user);
  }

  @Patch(':alertId/read')
  @ApiOperation({
    summary: 'Acknowledge an alert idempotently',
    operationId: 'readCertificateAlert',
  })
  read(
    @Param('alertId', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.alerts.markRead(id, user);
  }
}
