import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto/pagination.dto';
import { EnrollmentStatus } from '../../entities/enrollment.entity/enrollment.entity';

export class CreateEnrollmentDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() employeeId!: string;
  @ApiProperty({ format: 'uuid' }) @IsUUID() courseId!: string;
  @ApiPropertyOptional({ format: 'uuid' })
  @IsUUID()
  @IsOptional()
  learningPathEnrollmentId?: string;
  @ApiPropertyOptional({ format: 'uuid' })
  @IsUUID()
  @IsOptional()
  learningPathCourseId?: string;
}

export class ListEnrollmentsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsUUID()
  @IsOptional()
  employeeId?: string;
  @ApiPropertyOptional({ format: 'uuid' })
  @IsUUID()
  @IsOptional()
  courseId?: string;
  @ApiPropertyOptional({ enum: EnrollmentStatus })
  @IsEnum(EnrollmentStatus)
  @IsOptional()
  status?: EnrollmentStatus;
}
