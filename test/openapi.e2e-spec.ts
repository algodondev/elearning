import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApplication } from '../src/configure-application';

interface OpenApiOperation {
  tags?: string[];
  summary?: string;
  description?: string;
  operationId?: string;
  security?: Array<Record<string, string[]>>;
  parameters?: Array<{
    in?: string;
    name?: string;
    schema?: { format?: string };
    description?: string;
    example?: unknown;
  }>;
  responses?: Record<
    string,
    { content?: { 'application/json'?: { schema?: unknown } } }
  >;
}

interface OpenApiDocument {
  info: { title: string; version: string; description?: string };
  paths: Record<string, Record<string, OpenApiOperation>>;
  components?: { schemas?: Record<string, unknown> };
}

describe('OpenAPI contract (e2e)', () => {
  let app: INestApplication;
  let document: OpenApiDocument;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApplication(app);
    await app.init();
    const response = await request(app.getHttpServer())
      .get('/api-json')
      .expect(200);
    document = response.body as OpenApiDocument;
  });

  afterAll(async () => app.close());

  it('publishes detailed global API information', () => {
    expect(document.info).toMatchObject({
      title: 'Corporate E-Learning API',
      version: '1.0.0',
    });
    expect(document.info.description).toContain('RBAC');
    expect(document.info.description).toContain('UTC');
    expect(document.info.description).toContain('three');
  });

  it('documents every operation with identity, behavior, success schema, and protected errors', () => {
    const operationIds = new Set<string>();
    for (const [path, pathItem] of Object.entries(document.paths)) {
      for (const [verb, operation] of Object.entries(pathItem)) {
        if (!['get', 'post', 'patch', 'delete'].includes(verb)) continue;
        expect(operation.tags?.length).toBeGreaterThan(0);
        expect(operation.summary).toEqual(expect.any(String));
        expect(operation.description).toEqual(expect.any(String));
        expect(operation.operationId).toEqual(expect.any(String));
        expect(operationIds.has(operation.operationId!)).toBe(false);
        operationIds.add(operation.operationId!);

        const successCode = Object.keys(operation.responses ?? {}).find(
          (status) => status.startsWith('2'),
        );
        expect(successCode).toBeDefined();
        if (successCode !== '204') {
          expect(
            operation.responses?.[successCode!]?.content?.['application/json']
              ?.schema,
          ).toBeDefined();
        }

        const isPublic =
          path === '/api/v1/health' || path === '/api/v1/auth/login';
        if (!isPublic) {
          expect(operation.security).toContainEqual({ 'access-token': [] });
          expect(operation.responses).toHaveProperty('401');
          expect(operation.responses).toHaveProperty('403');
          expect(operation.responses).toHaveProperty('429');
        }

        for (const parameter of operation.parameters ?? []) {
          if (parameter.in !== 'path') continue;
          expect(parameter.schema?.format).toBe('uuid');
          expect(parameter.description).toEqual(expect.any(String));
          expect(parameter.example).toEqual(expect.any(String));
        }
      }
    }
    expect(operationIds.size).toBeGreaterThanOrEqual(50);
  });

  it('documents key business conflicts without exposing employee answer keys', () => {
    const attempt =
      document.paths['/api/v1/enrollments/{enrollmentId}/assessment-attempts']
        .post;
    expect(JSON.stringify(attempt.responses?.['409'])).toContain(
      'MODULES_INCOMPLETE',
    );
    expect(JSON.stringify(attempt.responses?.['409'])).toContain(
      'ASSESSMENT_ATTEMPTS_EXHAUSTED',
    );

    const unlock =
      document.paths[
        '/api/v1/learning-path-enrollments/{pathEnrollmentId}/courses/{courseId}/enroll'
      ].post;
    expect(JSON.stringify(unlock.responses?.['409'])).toContain(
      'LEARNING_PATH_PREREQUISITE_NOT_PASSED',
    );

    const employeeAssessment =
      document.paths['/api/v1/enrollments/{enrollmentId}/assessment'].get;
    expect(JSON.stringify(employeeAssessment)).not.toContain('isCorrect');
    expect(JSON.stringify(employeeAssessment)).not.toContain('passwordHash');
  });

  it('contains no dangling schema references and matches the generated artifact', async () => {
    const references = JSON.stringify(document).match(
      /#\/components\/schemas\/([A-Za-z0-9_]+)/g,
    );
    for (const reference of new Set(references ?? [])) {
      const schemaName = reference.split('/').at(-1)!;
      expect(document.components?.schemas).toHaveProperty(schemaName);
    }
    const stored = JSON.parse(
      await readFile(resolve(process.cwd(), 'docs/api/openapi.json'), 'utf8'),
    ) as OpenApiDocument;
    expect(stored).toEqual(document);
  });
});
