import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto/pagination.dto';

export class CreateEmployeeDto {
  @ApiProperty({ example: 'learner@example.com' })
  @Transform(({ value }: { value: string }) => value.trim().toLowerCase())
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 8, example: 'LearnerPass123!' })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ example: 'EMP-001' })
  @Transform(({ value }: { value: string }) => value.trim().toUpperCase())
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  employeeCode!: string;

  @ApiProperty() @IsString() @MinLength(1) firstName!: string;
  @ApiProperty() @IsString() @MinLength(1) lastName!: string;
  @ApiProperty({ format: 'uuid' }) @IsUUID() areaId!: string;
  @ApiProperty({ format: 'uuid' }) @IsUUID() jobLevelId!: string;
  @ApiProperty({ format: 'date', example: '2026-01-15' })
  @IsDateString()
  hireDate!: string;
}

export class UpdateEmployeeDto extends PartialType(CreateEmployeeDto) {
  @ApiPropertyOptional() @IsBoolean() @IsOptional() isActive?: boolean;
}

export class ListEmployeesDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsUUID()
  @IsOptional()
  areaId?: string;
  @ApiPropertyOptional({ format: 'uuid' })
  @IsUUID()
  @IsOptional()
  jobLevelId?: string;
  @ApiPropertyOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
  @ApiPropertyOptional() @IsString() @IsOptional() search?: string;
}
