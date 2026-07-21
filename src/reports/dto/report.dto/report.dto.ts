import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto/pagination.dto';

export class ComplianceReportQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    format: 'date-time',
    description: 'UTC classification instant; defaults to the server clock.',
  })
  @IsISO8601()
  @IsOptional()
  asOf?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Restrict the report to one mandatory published course.',
  })
  @IsUUID()
  @IsOptional()
  courseId?: string;
}

export class ComplianceSummaryDto {
  @ApiProperty({ format: 'uuid' }) areaId!: string;
  @ApiProperty() areaName!: string;
  @ApiProperty({ format: 'uuid' }) courseId!: string;
  @ApiProperty() courseCode!: string;
  @ApiProperty() courseTitle!: string;
  @ApiProperty({ format: 'date-time' }) asOf!: string;
  @ApiProperty() applicableActiveEmployees!: number;
  @ApiProperty() validCertificateEmployees!: number;
  @ApiProperty() expiredOnlyEmployees!: number;
  @ApiProperty() neverCertifiedEmployees!: number;
  @ApiProperty({
    example: 70.25,
    description:
      'validCertificateEmployees / applicableActiveEmployees × 100, rounded to two decimals; zero when the denominator is zero.',
  })
  compliancePercentage!: number;
}

export enum EmployeeComplianceStatus {
  VALID = 'VALID',
  EXPIRED_ONLY = 'EXPIRED_ONLY',
  NEVER_CERTIFIED = 'NEVER_CERTIFIED',
}

export class EmployeeComplianceDto {
  @ApiProperty({ format: 'uuid' }) employeeId!: string;
  @ApiProperty() employeeCode!: string;
  @ApiProperty() employeeName!: string;
  @ApiProperty({ format: 'uuid' }) courseId!: string;
  @ApiProperty() courseCode!: string;
  @ApiProperty({ enum: EmployeeComplianceStatus })
  status!: EmployeeComplianceStatus;
}
