import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user/current-user.decorator';
import { Roles } from '../auth/decorators/roles/roles.decorator';
import { UserRole } from '../auth/entities/user.entity/user.entity';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy/jwt.strategy';
import { CertificatesService, CertificateStatus } from './certificates.service';
import { ListCertificatesDto } from './dto/certificate.dto/certificate.dto';

@ApiTags('Certificates')
@ApiBearerAuth('access-token')
@Controller()
export class CertificatesController {
  constructor(private readonly certificates: CertificatesService) {}

  @Get('certificates')
  @ApiOperation({
    summary: 'List permitted certificates',
    operationId: 'listCertificates',
  })
  list(
    @Query() query: ListCertificatesDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.certificates.list(query, user);
  }

  @Get('certificates/expiring')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({
    summary: 'List certificates expiring within 30 days',
    operationId: 'listExpiringCertificates',
  })
  expiring(
    @Query() query: ListCertificatesDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    query.status = CertificateStatus.EXPIRING_SOON;
    return this.certificates.list(query, user);
  }

  @Get('certificates/expired')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({
    summary: 'List expired certificates',
    operationId: 'listExpiredCertificates',
  })
  expired(
    @Query() query: ListCertificatesDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    query.status = CertificateStatus.EXPIRED;
    return this.certificates.list(query, user);
  }

  @Get('certificates/:certificateId')
  @ApiOperation({
    summary: 'Get a permitted certificate',
    operationId: 'getCertificate',
  })
  get(
    @Param('certificateId', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.certificates.get(id, user);
  }

  @Get('employees/:employeeId/certificates')
  @ApiOperation({
    summary: 'List an employee certificate history',
    operationId: 'listEmployeeCertificates',
  })
  byEmployee(
    @Param('employeeId', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.certificates.employeeCertificates(id, user);
  }
}
