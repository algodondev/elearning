import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto/pagination.dto';
import { CourseStatus } from '../../entities/course.entity/course.entity';
import { ContentType } from '../../entities/module-content.entity/module-content.entity';

export class CreateCourseDto {
  @ApiProperty({ example: 'API-101' })
  @Transform(({ value }: { value: string }) => value.trim().toUpperCase())
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  code!: string;
  @ApiProperty() @IsString() @MinLength(1) title!: string;
  @ApiProperty() @IsString() description!: string;
  @ApiProperty({ minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  estimatedDurationMinutes!: number;
  @ApiProperty({ default: false }) @IsBoolean() isMandatory!: boolean;
  @ApiProperty({ minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  certificateValidityDays!: number;
}

export class UpdateCourseDto extends PartialType(CreateCourseDto) {}

export class ListCoursesDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: CourseStatus })
  @IsEnum(CourseStatus)
  @IsOptional()
  status?: CourseStatus;
  @ApiPropertyOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsOptional()
  isMandatory?: boolean;
  @ApiPropertyOptional() @IsString() @IsOptional() search?: string;
}

export class CreateCourseModuleDto {
  @ApiProperty() @IsString() @MinLength(1) title!: string;
  @ApiPropertyOptional() @IsString() @IsOptional() description?: string;
  @ApiProperty({ minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  sequenceNumber!: number;
  @ApiProperty({ minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  estimatedDurationMinutes!: number;
  @ApiProperty({ default: true }) @IsBoolean() isRequired!: boolean;
}

export class UpdateCourseModuleDto extends PartialType(CreateCourseModuleDto) {}

export class CreateModuleContentDto {
  @ApiProperty() @IsString() @MinLength(1) title!: string;
  @ApiProperty({ enum: ContentType })
  @IsEnum(ContentType)
  contentType!: ContentType;
  @ApiPropertyOptional()
  @ValidateIf(
    (dto: CreateModuleContentDto) => dto.contentType !== ContentType.TEXT,
  )
  @IsUrl({ require_protocol: true })
  contentUrl?: string;
  @ApiPropertyOptional()
  @ValidateIf(
    (dto: CreateModuleContentDto) => dto.contentType === ContentType.TEXT,
  )
  @IsString()
  @MinLength(1)
  body?: string;
  @ApiProperty({ minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  sequenceNumber!: number;
}

export class UpdateModuleContentDto extends PartialType(
  CreateModuleContentDto,
) {}
