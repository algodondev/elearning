import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { QuestionType } from '../../entities/question.entity/question.entity';

export class CreateAssessmentDto {
  @ApiProperty() @IsString() @MinLength(1) title!: string;
  @ApiPropertyOptional() @IsString() @IsOptional() instructions?: string;
  @ApiProperty({ minimum: 0.01, maximum: 100 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(100)
  passingScore!: number;
}

export class UpdateAssessmentDto extends PartialType(CreateAssessmentDto) {}

export class CreateQuestionOptionDto {
  @ApiProperty() @IsString() @MinLength(1) optionText!: string;
  @ApiProperty() @IsBoolean() isCorrect!: boolean;
  @ApiProperty({ minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  sequenceNumber!: number;
}

export class CreateQuestionDto {
  @ApiProperty() @IsString() @MinLength(1) prompt!: string;
  @ApiProperty({ enum: QuestionType })
  @IsEnum(QuestionType)
  questionType!: QuestionType;
  @ApiProperty({ minimum: 0.01 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  points!: number;
  @ApiProperty({ minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  sequenceNumber!: number;
  @ApiProperty({ type: [CreateQuestionOptionDto] })
  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionOptionDto)
  options!: CreateQuestionOptionDto[];
}

export class UpdateQuestionDto extends PartialType(CreateQuestionDto) {}

export class SubmittedAnswerDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() questionId!: string;
  @ApiProperty({ type: [String], format: 'uuid' })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID(undefined, { each: true })
  selectedOptionIds!: string[];
}

export class SubmitAttemptDto {
  @ApiProperty({ type: [SubmittedAnswerDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SubmittedAnswerDto)
  answers!: SubmittedAnswerDto[];
}
