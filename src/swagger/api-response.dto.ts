import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../auth/entities/user.entity/user.entity';
import { CertificateStatus } from '../certificates/dto/certificate.dto/certificate.dto';
import {
  CertificateAlertStatus,
  CertificateAlertType,
} from '../certificates/entities/certificate-alert.entity/certificate-alert.entity';
import { ContentType } from '../courses/entities/module-content.entity/module-content.entity';
import { CourseStatus } from '../courses/entities/course.entity/course.entity';
import { EnrollmentStatus } from '../enrollments/entities/enrollment.entity/enrollment.entity';
import { ModuleProgressStatus } from '../enrollments/entities/module-progress.entity/module-progress.entity';
import { LearningPathEnrollmentStatus } from '../learning-paths/entities/learning-path-enrollment.entity/learning-path-enrollment.entity';
import { LearningPathStatus } from '../learning-paths/entities/learning-path.entity/learning-path.entity';
import { QuestionType } from '../assessments/entities/question.entity/question.entity';
import { AssessmentStatus } from '../assessments/entities/assessment.entity/assessment.entity';

const UUID_EXAMPLE = '550e8400-e29b-41d4-a716-446655440000';
const DATE_EXAMPLE = '2026-07-20T14:30:00.000Z';

export enum LearningPathCourseProgressStatusDto {
  LOCKED = 'LOCKED',
  UNLOCKED = 'UNLOCKED',
  IN_PROGRESS = 'IN_PROGRESS',
  PASSED = 'PASSED',
}

export class ApiErrorResponseDto {
  @ApiProperty({ example: 409 }) statusCode!: number;
  @ApiProperty({ example: 'ACTIVE_ENROLLMENT_EXISTS' }) code!: string;
  @ApiProperty({ example: 'An active enrollment already exists.' })
  message!: string;
  @ApiPropertyOptional({
    description: 'Safe structured context; never stack traces or SQL.',
  })
  details?: unknown;
  @ApiProperty({ example: '/api/v1/enrollments' }) path!: string;
  @ApiProperty({ example: UUID_EXAMPLE }) requestId!: string;
  @ApiProperty({ format: 'date-time', example: DATE_EXAMPLE })
  timestamp!: string;
}

export class PaginationMetaResponseDto {
  @ApiProperty({ example: 1 }) page!: number;
  @ApiProperty({ example: 20 }) limit!: number;
  @ApiProperty({ example: 42 }) totalItems!: number;
  @ApiProperty({ example: 3 }) totalPages!: number;
}

export class TimestampedResponseDto {
  @ApiProperty({ format: 'uuid', example: UUID_EXAMPLE }) id!: string;
  @ApiProperty({ format: 'date-time', example: DATE_EXAMPLE })
  createdAt!: string;
  @ApiProperty({ format: 'date-time', example: DATE_EXAMPLE })
  updatedAt!: string;
}

export class HealthResponseDto {
  @ApiProperty({ example: 'ok' }) status!: string;
  @ApiProperty({ example: 'up' }) database!: string;
  @ApiProperty({ format: 'date-time', example: DATE_EXAMPLE })
  timestamp!: string;
}

export class ProfileResponseDto {
  @ApiProperty({ format: 'uuid', example: UUID_EXAMPLE }) id!: string;
  @ApiProperty({ example: 'admin@example.com' }) email!: string;
  @ApiProperty({ enum: UserRole }) role!: UserRole;
  @ApiProperty() isActive!: boolean;
  @ApiPropertyOptional({
    type: 'object',
    nullable: true,
    additionalProperties: true,
  })
  employee!: object | null;
}

export class AreaResponseDto extends TimestampedResponseDto {
  @ApiProperty({ example: 'Engineering' }) name!: string;
  @ApiPropertyOptional({ nullable: true }) description!: string | null;
  @ApiProperty() isActive!: boolean;
}

export class JobLevelResponseDto extends AreaResponseDto {
  @ApiProperty({ example: 2 }) rankOrder!: number;
}

export class EmployeeResponseDto extends TimestampedResponseDto {
  @ApiProperty({ example: 'EMP-001' }) employeeCode!: string;
  @ApiProperty({ example: 'Ada' }) firstName!: string;
  @ApiProperty({ example: 'Lovelace' }) lastName!: string;
  @ApiProperty({ format: 'uuid', example: UUID_EXAMPLE }) userId!: string;
  @ApiProperty({ format: 'uuid', example: UUID_EXAMPLE }) areaId!: string;
  @ApiProperty({ format: 'uuid', example: UUID_EXAMPLE }) jobLevelId!: string;
  @ApiProperty({ format: 'date', example: '2026-01-15' }) hireDate!: string;
  @ApiProperty() isActive!: boolean;
  @ApiPropertyOptional({ type: AreaResponseDto }) area?: AreaResponseDto;
  @ApiPropertyOptional({ type: JobLevelResponseDto })
  jobLevel?: JobLevelResponseDto;
}

export class ModuleContentResponseDto extends TimestampedResponseDto {
  @ApiProperty({ format: 'uuid', example: UUID_EXAMPLE }) moduleId!: string;
  @ApiProperty({ example: 'HTTP methods' }) title!: string;
  @ApiProperty({ enum: ContentType }) contentType!: ContentType;
  @ApiPropertyOptional({
    nullable: true,
    example: 'https://example.com/lesson',
  })
  contentUrl!: string | null;
  @ApiPropertyOptional({ nullable: true, example: 'Lesson text.' }) body!:
    string | null;
  @ApiProperty({ example: 1 }) sequenceNumber!: number;
}

export class CourseModuleResponseDto extends TimestampedResponseDto {
  @ApiProperty({ format: 'uuid', example: UUID_EXAMPLE }) courseId!: string;
  @ApiProperty({ example: 'HTTP semantics' }) title!: string;
  @ApiPropertyOptional({ nullable: true }) description!: string | null;
  @ApiProperty({ example: 1 }) sequenceNumber!: number;
  @ApiProperty({ example: 45 }) estimatedDurationMinutes!: number;
  @ApiProperty() isRequired!: boolean;
  @ApiPropertyOptional({ type: [ModuleContentResponseDto] })
  contents?: ModuleContentResponseDto[];
}

export class CourseResponseDto extends TimestampedResponseDto {
  @ApiProperty({ example: 'API-101' }) code!: string;
  @ApiProperty({ example: 'API Foundations' }) title!: string;
  @ApiProperty() description!: string;
  @ApiProperty({ example: 60 }) estimatedDurationMinutes!: number;
  @ApiProperty() isMandatory!: boolean;
  @ApiProperty({ example: 365 }) certificateValidityDays!: number;
  @ApiProperty({ enum: CourseStatus }) status!: CourseStatus;
  @ApiPropertyOptional({ type: [CourseModuleResponseDto] })
  modules?: CourseModuleResponseDto[];
}

export class AssessmentResponseDto extends TimestampedResponseDto {
  @ApiProperty({ format: 'uuid', example: UUID_EXAMPLE }) courseId!: string;
  @ApiProperty({ example: 1 }) version!: number;
  @ApiProperty({ example: 'Final assessment' }) title!: string;
  @ApiPropertyOptional({ nullable: true }) instructions!: string | null;
  @ApiProperty({ example: 70 }) passingScore!: number;
  @ApiProperty({ enum: AssessmentStatus }) status!: AssessmentStatus;
  @ApiPropertyOptional({ format: 'date-time', nullable: true }) publishedAt!:
    string | null;
}

export class AdminQuestionOptionResponseDto extends TimestampedResponseDto {
  @ApiProperty({ format: 'uuid', example: UUID_EXAMPLE }) questionId!: string;
  @ApiProperty({ example: 'GET' }) optionText!: string;
  @ApiProperty() isCorrect!: boolean;
  @ApiProperty({ example: 1 }) sequenceNumber!: number;
}

export class AdminQuestionResponseDto extends TimestampedResponseDto {
  @ApiProperty({ format: 'uuid', example: UUID_EXAMPLE }) assessmentId!: string;
  @ApiProperty({ example: 'Which method retrieves a resource?' })
  prompt!: string;
  @ApiProperty({ enum: QuestionType }) questionType!: QuestionType;
  @ApiProperty({ example: 10 }) points!: number;
  @ApiProperty({ example: 1 }) sequenceNumber!: number;
  @ApiProperty() isActive!: boolean;
  @ApiProperty({ type: [AdminQuestionOptionResponseDto] })
  options!: AdminQuestionOptionResponseDto[];
}

export class EmployeeQuestionOptionResponseDto {
  @ApiProperty({ format: 'uuid', example: UUID_EXAMPLE }) id!: string;
  @ApiProperty({ example: 'GET' }) optionText!: string;
  @ApiProperty({ example: 1 }) sequenceNumber!: number;
}

export class EmployeeQuestionResponseDto {
  @ApiProperty({ format: 'uuid', example: UUID_EXAMPLE }) id!: string;
  @ApiProperty({ example: 'Which method retrieves a resource?' })
  prompt!: string;
  @ApiProperty({ enum: QuestionType }) questionType!: QuestionType;
  @ApiProperty({ example: 10 }) points!: number;
  @ApiProperty({ example: 1 }) sequenceNumber!: number;
  @ApiProperty({ type: [EmployeeQuestionOptionResponseDto] })
  options!: EmployeeQuestionOptionResponseDto[];
}

export class EmployeeAssessmentResponseDto {
  @ApiProperty({ format: 'uuid', example: UUID_EXAMPLE }) id!: string;
  @ApiProperty({ example: 'Final assessment' }) title!: string;
  @ApiPropertyOptional({ nullable: true }) instructions!: string | null;
  @ApiProperty({ example: 70 }) passingScore!: number;
  @ApiProperty({ type: [EmployeeQuestionResponseDto] })
  questions!: EmployeeQuestionResponseDto[];
}

export class ModuleProgressResponseDto extends TimestampedResponseDto {
  @ApiProperty({ format: 'uuid', example: UUID_EXAMPLE }) enrollmentId!: string;
  @ApiProperty({ format: 'uuid', example: UUID_EXAMPLE }) moduleId!: string;
  @ApiProperty({ enum: ModuleProgressStatus }) status!: ModuleProgressStatus;
  @ApiPropertyOptional({ format: 'date-time', nullable: true }) completedAt!:
    string | null;
  @ApiPropertyOptional({ type: CourseModuleResponseDto })
  module?: CourseModuleResponseDto;
}

export class EnrollmentResponseDto extends TimestampedResponseDto {
  @ApiProperty({ format: 'uuid', example: UUID_EXAMPLE }) employeeId!: string;
  @ApiProperty({ format: 'uuid', example: UUID_EXAMPLE }) courseId!: string;
  @ApiProperty({ enum: EnrollmentStatus }) status!: EnrollmentStatus;
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  learningPathEnrollmentId!: string | null;
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  learningPathCourseId!: string | null;
  @ApiPropertyOptional({ format: 'uuid', nullable: true }) reenrollmentOfId!:
    string | null;
  @ApiProperty({ format: 'date-time', example: DATE_EXAMPLE })
  enrolledAt!: string;
  @ApiPropertyOptional({ format: 'date-time', nullable: true }) readyAt!:
    string | null;
  @ApiPropertyOptional({ format: 'date-time', nullable: true }) passedAt!:
    string | null;
  @ApiPropertyOptional({ format: 'date-time', nullable: true }) cancelledAt!:
    string | null;
  @ApiPropertyOptional({ type: [ModuleProgressResponseDto] })
  moduleProgress?: ModuleProgressResponseDto[];
}

export class CertificateResponseDto extends TimestampedResponseDto {
  @ApiProperty({ example: 'CERT-8A708506-BC5A-4191-AD51-20EC84C673FA' })
  certificateNumber!: string;
  @ApiProperty({ format: 'uuid', example: UUID_EXAMPLE }) employeeId!: string;
  @ApiProperty({ format: 'uuid', example: UUID_EXAMPLE }) courseId!: string;
  @ApiProperty({ format: 'uuid', example: UUID_EXAMPLE }) enrollmentId!: string;
  @ApiProperty({ format: 'date-time', example: DATE_EXAMPLE })
  issuedAt!: string;
  @ApiProperty({ format: 'date-time', example: '2027-07-20T14:30:00.000Z' })
  expiresAt!: string;
  @ApiProperty({ enum: CertificateStatus }) status!: CertificateStatus;
}

export class AttemptSubmissionResponseDto {
  @ApiProperty({ format: 'uuid', example: UUID_EXAMPLE }) id!: string;
  @ApiProperty({ example: 1, minimum: 1, maximum: 3 }) attemptNumber!: number;
  @ApiProperty({ example: 100 }) score!: number;
  @ApiProperty() passed!: boolean;
  @ApiProperty({ enum: EnrollmentStatus }) enrollmentStatus!: EnrollmentStatus;
  @ApiPropertyOptional({ type: CertificateResponseDto, nullable: true })
  certificate!: CertificateResponseDto | null;
}

export class AttemptHistoryResponseDto extends TimestampedResponseDto {
  @ApiProperty({ format: 'uuid', example: UUID_EXAMPLE }) enrollmentId!: string;
  @ApiProperty({ format: 'uuid', example: UUID_EXAMPLE }) assessmentId!: string;
  @ApiProperty({ example: 1 }) attemptNumber!: number;
  @ApiProperty({ example: 100 }) score!: number;
  @ApiProperty({ example: 70 }) passingScoreSnapshot!: number;
  @ApiProperty() passed!: boolean;
  @ApiProperty({ format: 'date-time', example: DATE_EXAMPLE })
  submittedAt!: string;
}

export class CertificateAlertResponseDto extends TimestampedResponseDto {
  @ApiProperty({ format: 'uuid', example: UUID_EXAMPLE })
  certificateId!: string;
  @ApiProperty({ format: 'uuid', example: UUID_EXAMPLE }) employeeId!: string;
  @ApiProperty({ enum: CertificateAlertType }) alertType!: CertificateAlertType;
  @ApiProperty({ enum: CertificateAlertStatus })
  status!: CertificateAlertStatus;
  @ApiProperty({ format: 'date-time', example: DATE_EXAMPLE })
  alertedAt!: string;
  @ApiPropertyOptional({ format: 'date-time', nullable: true }) readAt!:
    string | null;
}

export class AlertRunResponseDto {
  @ApiProperty({ example: 4 }) processed!: number;
  @ApiProperty({ example: 2 }) created!: number;
}

export class LearningPathCourseResponseDto extends TimestampedResponseDto {
  @ApiProperty({ format: 'uuid', example: UUID_EXAMPLE })
  learningPathId!: string;
  @ApiProperty({ format: 'uuid', example: UUID_EXAMPLE }) courseId!: string;
  @ApiProperty({ example: 1 }) sequenceNumber!: number;
  @ApiPropertyOptional({ type: CourseResponseDto }) course?: CourseResponseDto;
}

export class LearningPathResponseDto extends TimestampedResponseDto {
  @ApiProperty({ example: 'Backend engineering route' }) name!: string;
  @ApiPropertyOptional({ nullable: true }) description!: string | null;
  @ApiProperty({ enum: LearningPathStatus }) status!: LearningPathStatus;
  @ApiPropertyOptional({ type: [LearningPathCourseResponseDto] })
  courses?: LearningPathCourseResponseDto[];
}

export class LearningPathAssignmentCourseResponseDto extends LearningPathCourseResponseDto {
  @ApiProperty({ enum: LearningPathCourseProgressStatusDto })
  progressStatus!: LearningPathCourseProgressStatusDto;
}

export class LearningPathAssignmentResponseDto extends TimestampedResponseDto {
  @ApiProperty({ format: 'uuid', example: UUID_EXAMPLE })
  learningPathId!: string;
  @ApiProperty({ format: 'uuid', example: UUID_EXAMPLE }) employeeId!: string;
  @ApiProperty({ enum: LearningPathEnrollmentStatus })
  status!: LearningPathEnrollmentStatus;
  @ApiProperty({ format: 'date-time', example: DATE_EXAMPLE })
  enrolledAt!: string;
  @ApiPropertyOptional({ format: 'date-time', nullable: true }) completedAt!:
    string | null;
  @ApiPropertyOptional({ format: 'date-time', nullable: true }) cancelledAt!:
    string | null;
  @ApiPropertyOptional({ type: [LearningPathAssignmentCourseResponseDto] })
  courses?: LearningPathAssignmentCourseResponseDto[];
}

export class ComplianceAreaDetailResponseDto {
  @ApiProperty({ format: 'uuid', example: UUID_EXAMPLE }) areaId!: string;
  @ApiProperty({ format: 'date-time', example: DATE_EXAMPLE }) asOf!: string;
  @ApiProperty({ type: 'array', items: { type: 'object' } }) data!: object[];
  @ApiProperty({ type: PaginationMetaResponseDto })
  meta!: PaginationMetaResponseDto;
}

export const API_RESPONSE_MODELS = [
  ApiErrorResponseDto,
  PaginationMetaResponseDto,
  HealthResponseDto,
  ProfileResponseDto,
  AreaResponseDto,
  JobLevelResponseDto,
  EmployeeResponseDto,
  ModuleContentResponseDto,
  CourseModuleResponseDto,
  CourseResponseDto,
  AssessmentResponseDto,
  AdminQuestionOptionResponseDto,
  AdminQuestionResponseDto,
  EmployeeQuestionOptionResponseDto,
  EmployeeQuestionResponseDto,
  EmployeeAssessmentResponseDto,
  ModuleProgressResponseDto,
  EnrollmentResponseDto,
  CertificateResponseDto,
  AttemptSubmissionResponseDto,
  AttemptHistoryResponseDto,
  CertificateAlertResponseDto,
  AlertRunResponseDto,
  LearningPathCourseResponseDto,
  LearningPathResponseDto,
  LearningPathAssignmentCourseResponseDto,
  LearningPathAssignmentResponseDto,
  ComplianceAreaDetailResponseDto,
];
