import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsISO8601, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto/pagination.dto';
import {
  CertificateAlertStatus,
  CertificateAlertType,
} from '../../entities/certificate-alert.entity/certificate-alert.entity';

export enum CertificateStatus {
  VALID = 'VALID',
  EXPIRING_SOON = 'EXPIRING_SOON',
  EXPIRED = 'EXPIRED',
}

export class ListCertificatesDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsUUID()
  @IsOptional()
  employeeId?: string;
  @ApiPropertyOptional({ format: 'uuid' })
  @IsUUID()
  @IsOptional()
  courseId?: string;
  @ApiPropertyOptional({ enum: CertificateStatus })
  @IsEnum(CertificateStatus)
  @IsOptional()
  status?: CertificateStatus;
  @ApiPropertyOptional({ format: 'date-time' })
  @IsISO8601()
  @IsOptional()
  asOf?: string;
}

export class ListCertificateAlertsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsUUID()
  @IsOptional()
  employeeId?: string;
  @ApiPropertyOptional({ enum: CertificateAlertStatus })
  @IsEnum(CertificateAlertStatus)
  @IsOptional()
  status?: CertificateAlertStatus;
  @ApiPropertyOptional({ enum: CertificateAlertType })
  @IsEnum(CertificateAlertType)
  @IsOptional()
  alertType?: CertificateAlertType;
}
