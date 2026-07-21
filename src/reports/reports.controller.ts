import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles/roles.decorator';
import { UserRole } from '../auth/entities/user.entity/user.entity';
import { ComplianceReportQueryDto } from './dto/report.dto/report.dto';
import { ReportsService } from './reports.service';

@ApiTags('Reports')
@ApiBearerAuth('access-token')
@Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('compliance/by-area')
  @ApiOperation({
    summary: 'Report mandatory-course compliance by area',
    description:
      'Counts each active employee once per mandatory published course. A certificate is valid when expiresAt is later than asOf. Percentage is valid / applicable × 100, rounded to two decimals.',
    operationId: 'reportComplianceByArea',
  })
  byArea(@Query() query: ComplianceReportQueryDto) {
    return this.reports.complianceByArea(query);
  }

  @Get('compliance/by-area/:areaId')
  @ApiOperation({
    summary: 'List employee compliance classifications for one area',
    operationId: 'reportComplianceAreaDetail',
  })
  areaDetail(
    @Param('areaId', ParseUUIDPipe) areaId: string,
    @Query() query: ComplianceReportQueryDto,
  ) {
    return this.reports.complianceAreaDetail(areaId, query);
  }
}
