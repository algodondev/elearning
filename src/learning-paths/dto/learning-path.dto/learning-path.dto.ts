import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto/pagination.dto';

export class CreateLearningPathDto {
  @ApiProperty() @IsString() @MinLength(1) name!: string;
  @ApiPropertyOptional() @IsString() @IsOptional() description?: string;
}

export class UpdateLearningPathDto extends PartialType(CreateLearningPathDto) {}

export class AddLearningPathCourseDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() courseId!: string;
  @ApiProperty({ minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  sequenceNumber!: number;
}

export class ReorderLearningPathCourseDto {
  @ApiProperty({ minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  sequenceNumber!: number;
}

export class AssignLearningPathDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() learningPathId!: string;
  @ApiProperty({ format: 'uuid' }) @IsUUID() employeeId!: string;
}

export class ListLearningPathEnrollmentsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsUUID()
  @IsOptional()
  learningPathId?: string;
  @ApiPropertyOptional({ format: 'uuid' })
  @IsUUID()
  @IsOptional()
  employeeId?: string;
}
