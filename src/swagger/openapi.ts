import { INestApplication, Type } from '@nestjs/common';
import {
  DocumentBuilder,
  getSchemaPath,
  OpenAPIObject,
  SwaggerModule,
} from '@nestjs/swagger';
import { LoginResponseDto } from '../auth/dto/auth.dto/auth.dto';
import {
  ComplianceSummaryDto,
  EmployeeComplianceDto,
} from '../reports/dto/report.dto/report.dto';
import {
  AdminQuestionResponseDto,
  AlertRunResponseDto,
  API_RESPONSE_MODELS,
  ApiErrorResponseDto,
  AreaResponseDto,
  AssessmentResponseDto,
  AttemptHistoryResponseDto,
  AttemptSubmissionResponseDto,
  CertificateAlertResponseDto,
  CertificateResponseDto,
  ComplianceAreaDetailResponseDto,
  CourseModuleResponseDto,
  CourseResponseDto,
  EmployeeAssessmentResponseDto,
  EmployeeResponseDto,
  EnrollmentResponseDto,
  HealthResponseDto,
  JobLevelResponseDto,
  LearningPathAssignmentResponseDto,
  LearningPathCourseResponseDto,
  LearningPathResponseDto,
  ModuleContentResponseDto,
  PaginationMetaResponseDto,
  ProfileResponseDto,
} from './api-response.dto';

type JsonSchema = Record<string, unknown>;
type Operation = {
  tags?: string[];
  summary?: string;
  description?: string;
  operationId?: string;
  security?: Array<Record<string, string[]>>;
  parameters?: Array<Record<string, unknown>>;
  responses?: Record<string, Record<string, unknown>>;
};

const UUID_EXAMPLE = '550e8400-e29b-41d4-a716-446655440000';

const TAG_CONTEXT: Record<string, string> = {
  Auth: 'Credentials are never returned. JWT access is revalidated against the active user on every protected request.',
  Health:
    'This public readiness probe verifies both the HTTP application and PostgreSQL dependency.',
  Organization:
    'Names are case-insensitively unique; archival preserves history and is blocked by active dependents.',
  Employees:
    'ADMIN and HR_MANAGER manage employees; EMPLOYEE access is limited to the authenticated employee record.',
  Courses:
    'Course structure is ordered and becomes immutable after enrollment; only complete courses can be published.',
  Assessments:
    'Published assessment versions are immutable. Employee assessment contracts never contain answer correctness.',
  Enrollments:
    'Enrollment and module progress follow explicit states; duplicate active employee/course enrollments are rejected.',
  Certificates:
    'Certificate status is derived at request time from UTC expiration boundaries and is never stored as mutable state.',
  'Certificate alerts':
    'Generation and acknowledgement are idempotent; employees can only access their own alerts.',
  'Learning paths':
    'A published path is sequential, locks after first assignment, and uses historical passes for prerequisites.',
  'Learning path assignments':
    'The first course is unlocked and each later course requires PASSED on the immediately previous course.',
  Reports:
    'Compliance includes active employees and mandatory published courses, deduplicates certificate history, and uses UTC asOf.',
};

const singleModels: Record<string, Type<unknown>> = {
  health: HealthResponseDto,
  authLogin: LoginResponseDto,
  authProfile: ProfileResponseDto,
  createArea: AreaResponseDto,
  getArea: AreaResponseDto,
  updateArea: AreaResponseDto,
  createJobLevel: JobLevelResponseDto,
  getJobLevel: JobLevelResponseDto,
  updateJobLevel: JobLevelResponseDto,
  createEmployee: EmployeeResponseDto,
  getEmployee: EmployeeResponseDto,
  updateEmployee: EmployeeResponseDto,
  createCourse: CourseResponseDto,
  getCourse: CourseResponseDto,
  updateCourse: CourseResponseDto,
  publishCourse: CourseResponseDto,
  createCourseModule: CourseModuleResponseDto,
  getCourseModule: CourseModuleResponseDto,
  updateCourseModule: CourseModuleResponseDto,
  createModuleContent: ModuleContentResponseDto,
  updateModuleContent: ModuleContentResponseDto,
  createAssessment: AssessmentResponseDto,
  getCurrentAssessment: AssessmentResponseDto,
  updateAssessment: AssessmentResponseDto,
  publishAssessment: AssessmentResponseDto,
  createAssessmentQuestion: AdminQuestionResponseDto,
  getAssessmentQuestion: AdminQuestionResponseDto,
  updateAssessmentQuestion: AdminQuestionResponseDto,
  getEnrollmentAssessment: EmployeeAssessmentResponseDto,
  submitAssessmentAttempt: AttemptSubmissionResponseDto,
  createEnrollment: EnrollmentResponseDto,
  getEnrollment: EnrollmentResponseDto,
  cancelEnrollment: EnrollmentResponseDto,
  completeEnrollmentModule: EnrollmentResponseDto,
  reEnroll: EnrollmentResponseDto,
  getCertificate: CertificateResponseDto,
  runCertificateAlerts: AlertRunResponseDto,
  readCertificateAlert: CertificateAlertResponseDto,
  createLearningPath: LearningPathResponseDto,
  getLearningPath: LearningPathResponseDto,
  updateLearningPath: LearningPathResponseDto,
  publishLearningPath: LearningPathResponseDto,
  addLearningPathCourse: LearningPathCourseResponseDto,
  reorderLearningPathCourse: LearningPathCourseResponseDto,
  assignLearningPath: LearningPathAssignmentResponseDto,
  getLearningPathAssignment: LearningPathAssignmentResponseDto,
  enrollLearningPathCourse: EnrollmentResponseDto,
  reportComplianceAreaDetail: ComplianceAreaDetailResponseDto,
};

const arrayModels: Record<string, Type<unknown>> = {
  listCourseModules: CourseModuleResponseDto,
  listModuleContents: ModuleContentResponseDto,
  listAssessmentQuestions: AdminQuestionResponseDto,
  listAssessmentAttempts: AttemptHistoryResponseDto,
};

const paginatedModels: Record<string, Type<unknown>> = {
  listAreas: AreaResponseDto,
  listJobLevels: JobLevelResponseDto,
  listEmployees: EmployeeResponseDto,
  listCourses: CourseResponseDto,
  listEnrollments: EnrollmentResponseDto,
  listCertificates: CertificateResponseDto,
  listExpiringCertificates: CertificateResponseDto,
  listExpiredCertificates: CertificateResponseDto,
  listEmployeeCertificates: CertificateResponseDto,
  listCertificateAlerts: CertificateAlertResponseDto,
  listLearningPaths: LearningPathResponseDto,
  listLearningPathAssignments: LearningPathAssignmentResponseDto,
  reportComplianceByArea: ComplianceSummaryDto,
};

const noContentOperations = new Set([
  'archiveArea',
  'archiveJobLevel',
  'deactivateEmployee',
  'archiveCourse',
  'deleteCourseModule',
  'deleteModuleContent',
  'deleteAssessmentQuestion',
  'archiveLearningPath',
  'removeLearningPathCourse',
]);

export function buildOpenApiDocument(app: INestApplication): OpenAPIObject {
  const configuration = new DocumentBuilder()
    .setTitle('Corporate E-Learning API')
    .setDescription(
      [
        'Versioned REST API for corporate learning, assessment, certification, sequential learning paths, alerts, and compliance.',
        'RBAC roles are ADMIN, HR_MANAGER, and EMPLOYEE; employee access is ownership-scoped.',
        'All timestamps and asOf calculations use UTC. Collection endpoints use page/limit pagination.',
        'Required modules must be complete before assessment. Each enrollment permits three attempts; the third failure requires re-enrollment.',
        'Learning paths unlock one course at a time after a historical pass. Certificates expire dynamically and compliance counts each employee/course once.',
        'Errors use one safe envelope with statusCode, code, message, path, requestId, timestamp, and optional details.',
      ].join('\n\n'),
    )
    .setVersion('1.0.0')
    .addServer('http://localhost:3000', 'Local Docker development')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .build();
  const document = SwaggerModule.createDocument(app, configuration, {
    extraModels: [
      ...API_RESPONSE_MODELS,
      LoginResponseDto,
      ComplianceSummaryDto,
      EmployeeComplianceDto,
    ],
  });
  enhanceDocument(document);
  return document;
}

function enhanceDocument(document: OpenAPIObject): void {
  for (const [path, pathItem] of Object.entries(document.paths)) {
    for (const [verb, rawOperation] of Object.entries(pathItem ?? {})) {
      if (!['get', 'post', 'patch', 'delete'].includes(verb) || !rawOperation)
        continue;
      const operation = rawOperation as Operation;
      const operationId = operation.operationId ?? '';
      const tag = operation.tags?.[0] ?? 'API';
      operation.description =
        operation.description ??
        `${operation.summary ?? 'Execute operation'}. ${TAG_CONTEXT[tag] ?? 'The operation uses validated DTOs and the standard error envelope.'}`;
      operation.responses ??= {};

      const publicOperation =
        path === '/api/v1/health' || path === '/api/v1/auth/login';
      if (!publicOperation) {
        operation.security = [{ 'access-token': [] }];
        addError(
          operation,
          '401',
          'UNAUTHORIZED',
          'JWT is missing, invalid, expired, or belongs to an inactive identity.',
        );
        addError(
          operation,
          '403',
          'FORBIDDEN',
          'The authenticated role or resource owner is not allowed.',
        );
        addError(
          operation,
          '429',
          'TOO_MANY_REQUESTS',
          'The request rate limit was exceeded.',
        );
      }
      if (['post', 'patch'].includes(verb)) {
        addError(
          operation,
          '400',
          'VALIDATION_FAILED',
          'The request body or parameters failed DTO validation.',
        );
      }
      if (path.includes('{')) {
        addError(
          operation,
          '404',
          'NOT_FOUND',
          'The requested resource or nested relationship was not found.',
        );
      }
      if (['post', 'patch', 'delete'].includes(verb)) {
        addError(
          operation,
          '409',
          'CONFLICT',
          'The operation violates the current resource state or a business constraint.',
        );
      }

      if (operationId === 'submitAssessmentAttempt') {
        addConflictExamples(operation, {
          modulesIncomplete: {
            summary: 'Required modules are incomplete',
            value: errorExample(
              'MODULES_INCOMPLETE',
              'All required modules must be completed before an attempt.',
              {
                missingModuleIds: [UUID_EXAMPLE],
              },
            ),
          },
          attemptsExhausted: {
            summary: 'Three attempts already used',
            value: errorExample(
              'ASSESSMENT_ATTEMPTS_EXHAUSTED',
              'The enrollment requires re-enrollment before another attempt.',
            ),
          },
        });
      }
      if (operationId === 'enrollLearningPathCourse') {
        addConflictExamples(operation, {
          prerequisite: {
            summary: 'Previous course is not passed',
            value: errorExample(
              'LEARNING_PATH_PREREQUISITE_NOT_PASSED',
              'The immediately previous course must be passed first.',
              {
                previousCourseId: UUID_EXAMPLE,
              },
            ),
          },
        });
      }
      if (operationId === 'reEnroll') {
        addConflictExamples(operation, {
          notRequired: {
            summary: 'Third failure has not occurred',
            value: errorExample(
              'REENROLLMENT_NOT_ALLOWED',
              'Re-enrollment is only allowed after the third failed attempt.',
            ),
          },
        });
      }

      for (const rawParameter of operation.parameters ?? []) {
        const parameter = rawParameter as {
          in?: string;
          name?: string;
          description?: string;
          example?: unknown;
          schema?: Record<string, unknown>;
        };
        if (parameter.in !== 'path') continue;
        parameter.schema ??= {};
        parameter.schema.type = 'string';
        parameter.schema.format = 'uuid';
        parameter.description ??= `UUID of the ${humanize(parameter.name ?? 'resource')}.`;
        parameter.example ??= UUID_EXAMPLE;
      }

      const existingSuccess = Object.keys(operation.responses).find((code) =>
        code.startsWith('2'),
      );
      const successCode = noContentOperations.has(operationId)
        ? '204'
        : (existingSuccess ?? (verb === 'post' ? '201' : '200'));
      if (noContentOperations.has(operationId)) {
        operation.responses = {
          ...operation.responses,
          '204': { description: 'Operation completed; no response body.' },
        };
        delete operation.responses['200'];
        continue;
      }
      const schema = responseSchema(operationId);
      operation.responses[successCode] = {
        description: successDescription(operationId),
        content: {
          'application/json': {
            schema,
          },
        },
      };
    }
  }
}

function responseSchema(operationId: string): JsonSchema {
  const single = singleModels[operationId];
  if (single) return { $ref: getSchemaPath(single) };
  const array = arrayModels[operationId];
  if (array) return { type: 'array', items: { $ref: getSchemaPath(array) } };
  const paginated = paginatedModels[operationId];
  if (paginated)
    return {
      type: 'object',
      required: ['data', 'meta'],
      properties: {
        data: { type: 'array', items: { $ref: getSchemaPath(paginated) } },
        meta: { $ref: getSchemaPath(PaginationMetaResponseDto) },
      },
    };
  return { type: 'object', additionalProperties: false };
}

function addError(
  operation: Operation,
  status: string,
  code: string,
  message: string,
): void {
  operation.responses ??= {};
  operation.responses[status] ??= {
    description: message,
    content: {
      'application/json': {
        schema: { $ref: getSchemaPath(ApiErrorResponseDto) },
        example: errorExample(code, message),
      },
    },
  };
}

function addConflictExamples(
  operation: Operation,
  examples: Record<string, { summary: string; value: unknown }>,
): void {
  operation.responses ??= {};
  operation.responses['409'] = {
    description: 'A business precondition prevents the operation.',
    content: {
      'application/json': {
        schema: { $ref: getSchemaPath(ApiErrorResponseDto) },
        examples,
      },
    },
  };
}

function errorExample(
  code: string,
  message: string,
  details?: unknown,
): Record<string, unknown> {
  return {
    statusCode: 409,
    code,
    message,
    ...(details === undefined ? {} : { details }),
    path: '/api/v1/resource',
    requestId: UUID_EXAMPLE,
    timestamp: '2026-07-20T14:30:00.000Z',
  };
}

function humanize(value: string): string {
  return value
    .replace(/Id$/, '')
    .replace(/([A-Z])/g, ' $1')
    .toLowerCase();
}

function successDescription(operationId: string): string {
  if (operationId === 'submitAssessmentAttempt')
    return 'Scored attempt. A pass includes the exactly-once issued certificate; a third failure returns REENROLLMENT_REQUIRED as enrollmentStatus.';
  if (operationId === 'reportComplianceByArea')
    return 'Paginated area/course totals whose valid, expired-only, and never-certified counts reconcile to the active-employee denominator.';
  return 'Successful response with the documented public resource representation.';
}
