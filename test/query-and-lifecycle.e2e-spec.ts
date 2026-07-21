import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { CertificateEntity } from '../src/certificates/entities/certificate.entity/certificate.entity';
import { configureApplication } from '../src/configure-application';
import { seedDevelopmentDatabase } from '../src/database/seeds/development.seed/development.seed';
import {
  EnrollmentEntity,
  EnrollmentStatus,
} from '../src/enrollments/entities/enrollment.entity/enrollment.entity';

const IDS = {
  operationsArea: '10000000-0000-4000-8000-000000000001',
  engineeringArea: '10000000-0000-4000-8000-000000000002',
  associateLevel: '20000000-0000-4000-8000-000000000001',
  managerLevel: '20000000-0000-4000-8000-000000000002',
  seedCourse: '50000000-0000-4000-8000-000000000001',
} as const;

describe('Query filters and resource lifecycle edges (e2e)', () => {
  let app: INestApplication;
  let db: DataSource;
  let adminToken: string;
  let learnerToken: string;
  let employeeId: string;
  let courseId: string;
  let moduleId: string;

  const api = () => app.getHttpServer();
  const admin = (test: request.Test) =>
    test.set('Authorization', `Bearer ${adminToken}`);

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApplication(app);
    await app.init();
    db = app.get(DataSource);
    await seedDevelopmentDatabase(db);
    adminToken = (
      await request(api())
        .post('/api/v1/auth/login')
        .send({ email: 'admin@elearning.local', password: 'DevOnly123!' })
        .expect(201)
    ).body.accessToken as string;
    learnerToken = (
      await request(api())
        .post('/api/v1/auth/login')
        .send({ email: 'learner@elearning.local', password: 'DevOnly123!' })
        .expect(201)
    ).body.accessToken as string;
  });

  afterAll(async () => app.close());

  it('covers organization and employee query/update/archive rules', async () => {
    await admin(
      request(api()).get(
        '/api/v1/areas?search=oper&isActive=true&page=1&limit=10',
      ),
    )
      .expect(200)
      .expect(({ body }) => expect(body.data).toHaveLength(1));
    await admin(request(api()).get(`/api/v1/areas/${IDS.operationsArea}`))
      .expect(200)
      .expect(({ body }) => expect(body.name).toBe('Operations'));
    await admin(
      request(api())
        .patch(`/api/v1/areas/${IDS.operationsArea}`)
        .send({ description: 'Updated operations' }),
    ).expect(200);

    const temporaryArea = await admin(
      request(api())
        .post('/api/v1/areas')
        .send({ name: 'Temporary archive area' }),
    ).expect(201);
    await admin(
      request(api()).delete(`/api/v1/areas/${temporaryArea.body.id}`),
    ).expect(204);
    await admin(
      request(api()).post('/api/v1/areas').send({ name: 'operations' }),
    )
      .expect(409)
      .expect(({ body }) => expect(body.code).toBe('AREA_NAME_EXISTS'));

    await admin(
      request(api()).get(
        '/api/v1/job-levels?search=manager&isActive=true&page=1&limit=5',
      ),
    )
      .expect(200)
      .expect(({ body }) => expect(body.data).toHaveLength(1));
    await admin(request(api()).get(`/api/v1/job-levels/${IDS.managerLevel}`))
      .expect(200)
      .expect(({ body }) => expect(body.rankOrder).toBe(2));
    await admin(
      request(api())
        .patch(`/api/v1/job-levels/${IDS.managerLevel}`)
        .send({ name: 'Senior Manager', rankOrder: 3 }),
    ).expect(200);
    await admin(
      request(api())
        .post('/api/v1/job-levels')
        .send({ name: 'Duplicate Rank', rankOrder: 3 }),
    )
      .expect(409)
      .expect(({ body }) => expect(body.code).toBe('JOB_LEVEL_EXISTS'));
    await admin(
      request(api()).delete(`/api/v1/job-levels/${IDS.managerLevel}`),
    ).expect(204);

    const employee = await admin(
      request(api()).post('/api/v1/employees').send({
        email: 'lifecycle@example.com',
        password: 'LifecyclePass123!',
        employeeCode: 'EMP-LIFE-001',
        firstName: 'Life',
        lastName: 'Cycle',
        areaId: IDS.operationsArea,
        jobLevelId: IDS.associateLevel,
        hireDate: '2026-02-01',
      }),
    ).expect(201);
    employeeId = employee.body.id as string;
    await admin(
      request(api()).get(
        `/api/v1/employees?areaId=${IDS.operationsArea}&jobLevelId=${IDS.associateLevel}&isActive=true&search=life`,
      ),
    )
      .expect(200)
      .expect(({ body }) => expect(body.data[0].id).toBe(employeeId));
    await request(api())
      .get(`/api/v1/employees/${employeeId}`)
      .set('Authorization', `Bearer ${learnerToken}`)
      .expect(403);
    await admin(
      request(api()).patch(`/api/v1/employees/${employeeId}`).send({
        email: 'lifecycle.updated@example.com',
        password: 'UpdatedPass123!',
        firstName: 'Updated',
        isActive: true,
      }),
    )
      .expect(200)
      .expect(({ body }) => expect(body.firstName).toBe('Updated'));
    await admin(
      request(api()).post('/api/v1/employees').send({
        email: 'lifecycle.updated@example.com',
        password: 'DuplicatePass123!',
        employeeCode: 'EMP-LIFE-002',
        firstName: 'Duplicate',
        lastName: 'Email',
        areaId: IDS.operationsArea,
        jobLevelId: IDS.associateLevel,
        hireDate: '2026-02-01',
      }),
    ).expect(409);
  });

  it('covers draft authoring queries, edits, validation, and publication locks', async () => {
    const course = await admin(
      request(api()).post('/api/v1/courses').send({
        code: 'LIFE-101',
        title: 'Lifecycle Course',
        description: 'Draft lifecycle coverage',
        estimatedDurationMinutes: 45,
        isMandatory: false,
        certificateValidityDays: 90,
      }),
    ).expect(201);
    courseId = course.body.id as string;
    await admin(
      request(api()).get(
        '/api/v1/courses?status=DRAFT&isMandatory=false&search=lifecycle',
      ),
    )
      .expect(200)
      .expect(({ body }) => expect(body.data[0].id).toBe(courseId));
    await request(api())
      .get('/api/v1/courses?status=DRAFT')
      .set('Authorization', `Bearer ${learnerToken}`)
      .expect(200)
      .expect(({ body }) =>
        expect(
          body.data.every(
            (item: { status: string }) => item.status === 'PUBLISHED',
          ),
        ).toBe(true),
      );
    await admin(
      request(api())
        .patch(`/api/v1/courses/${courseId}`)
        .send({ code: 'LIFE-102', title: 'Updated Lifecycle Course' }),
    ).expect(200);
    await admin(request(api()).post(`/api/v1/courses/${courseId}/publish`))
      .expect(409)
      .expect(({ body }) => expect(body.code).toBe('COURSE_NOT_PUBLISHABLE'));

    const courseModule = await admin(
      request(api()).post(`/api/v1/courses/${courseId}/modules`).send({
        title: 'Draft module',
        sequenceNumber: 1,
        estimatedDurationMinutes: 45,
        isRequired: true,
      }),
    ).expect(201);
    moduleId = courseModule.body.id as string;
    await admin(request(api()).get(`/api/v1/courses/${courseId}/modules`))
      .expect(200)
      .expect(({ body }) => expect(body).toHaveLength(1));
    await admin(
      request(api()).get(`/api/v1/courses/${courseId}/modules/${moduleId}`),
    ).expect(200);
    await admin(
      request(api())
        .patch(`/api/v1/courses/${courseId}/modules/${moduleId}`)
        .send({ title: 'Updated module' }),
    ).expect(200);
    await admin(
      request(api()).post(`/api/v1/modules/${moduleId}/contents`).send({
        title: 'Invalid content',
        contentType: 'TEXT',
        contentUrl: 'https://example.com',
        body: 'Cannot be combined with a URL.',
        sequenceNumber: 1,
      }),
    )
      .expect(400)
      .expect(({ body }) => expect(body.code).toBe('INVALID_CONTENT_PAYLOAD'));
    const content = await admin(
      request(api()).post(`/api/v1/modules/${moduleId}/contents`).send({
        title: 'External lesson',
        contentType: 'LINK',
        contentUrl: 'https://example.com/lesson',
        sequenceNumber: 1,
      }),
    ).expect(201);
    await admin(request(api()).get(`/api/v1/modules/${moduleId}/contents`))
      .expect(200)
      .expect(({ body }) => expect(body).toHaveLength(1));
    await admin(
      request(api())
        .patch(`/api/v1/modules/${moduleId}/contents/${content.body.id}`)
        .send({ title: 'Updated external lesson' }),
    ).expect(200);
    await admin(
      request(api()).delete(
        `/api/v1/modules/${moduleId}/contents/${content.body.id}`,
      ),
    ).expect(204);

    const assessment = await admin(
      request(api())
        .post(`/api/v1/courses/${courseId}/assessments`)
        .send({ title: 'Lifecycle assessment', passingScore: 75 }),
    ).expect(201);
    const assessmentId = assessment.body.id as string;
    await admin(
      request(api()).get(`/api/v1/courses/${courseId}/assessments/current`),
    ).expect(404);
    await admin(
      request(api())
        .patch(`/api/v1/assessments/${assessmentId}`)
        .send({ title: 'Updated assessment', instructions: 'Answer all' }),
    ).expect(200);
    await admin(
      request(api())
        .post(`/api/v1/assessments/${assessmentId}/questions`)
        .send({
          prompt: 'Invalid correctness',
          questionType: 'SINGLE_CHOICE',
          points: 10,
          sequenceNumber: 1,
          options: [
            { optionText: 'A', isCorrect: true, sequenceNumber: 1 },
            { optionText: 'B', isCorrect: true, sequenceNumber: 2 },
          ],
        }),
    )
      .expect(400)
      .expect(({ body }) => expect(body.code).toBe('INVALID_QUESTION_OPTIONS'));
    const question = await admin(
      request(api())
        .post(`/api/v1/assessments/${assessmentId}/questions`)
        .send({
          prompt: 'The API uses DTO validation.',
          questionType: 'TRUE_FALSE',
          points: 10,
          sequenceNumber: 1,
          options: [
            { optionText: 'True', isCorrect: true, sequenceNumber: 1 },
            { optionText: 'False', isCorrect: false, sequenceNumber: 2 },
          ],
        }),
    ).expect(201);
    await admin(
      request(api()).get(`/api/v1/assessments/${assessmentId}/questions`),
    )
      .expect(200)
      .expect(({ body }) => expect(body).toHaveLength(1));
    await admin(
      request(api()).get(
        `/api/v1/assessments/${assessmentId}/questions/${question.body.id}`,
      ),
    ).expect(200);
    await admin(
      request(api())
        .patch(
          `/api/v1/assessments/${assessmentId}/questions/${question.body.id}`,
        )
        .send({ prompt: 'DTO validation is enabled.' }),
    ).expect(200);
    const removable = await admin(
      request(api())
        .post(`/api/v1/assessments/${assessmentId}/questions`)
        .send({
          prompt: 'Removable question',
          questionType: 'MULTIPLE_CHOICE',
          points: 5,
          sequenceNumber: 2,
          options: [
            { optionText: 'A', isCorrect: true, sequenceNumber: 1 },
            { optionText: 'B', isCorrect: true, sequenceNumber: 2 },
          ],
        }),
    ).expect(201);
    await admin(
      request(api()).delete(
        `/api/v1/assessments/${assessmentId}/questions/${removable.body.id}`,
      ),
    ).expect(204);
    await admin(
      request(api()).post(`/api/v1/assessments/${assessmentId}/publish`),
    ).expect(201);
    await admin(
      request(api()).get(`/api/v1/courses/${courseId}/assessments/current`),
    ).expect(200);
    await admin(
      request(api())
        .patch(`/api/v1/assessments/${assessmentId}`)
        .send({ title: 'Locked edit' }),
    )
      .expect(409)
      .expect(({ body }) => expect(body.code).toBe('ASSESSMENT_LOCKED'));
    await admin(request(api()).post(`/api/v1/courses/${courseId}/publish`))
      .expect(201)
      .expect(({ body }) => expect(body.status).toBe('PUBLISHED'));
  });

  it('covers enrollment, path, certificate, alert, and report query branches', async () => {
    const enrollment = await admin(
      request(api()).post('/api/v1/enrollments').send({ employeeId, courseId }),
    ).expect(201);
    await admin(
      request(api()).post('/api/v1/enrollments').send({ employeeId, courseId }),
    )
      .expect(409)
      .expect(({ body }) => expect(body.code).toBe('ACTIVE_ENROLLMENT_EXISTS'));
    await admin(
      request(api()).get(
        `/api/v1/enrollments?employeeId=${employeeId}&courseId=${courseId}&status=ENROLLED`,
      ),
    )
      .expect(200)
      .expect(({ body }) => expect(body.data).toHaveLength(1));
    await request(api())
      .get(`/api/v1/enrollments/${enrollment.body.id}`)
      .set('Authorization', `Bearer ${learnerToken}`)
      .expect(403);
    await admin(
      request(api()).post(
        `/api/v1/enrollments/${enrollment.body.id}/modules/${moduleId}/complete`,
      ),
    ).expect(201);
    await admin(
      request(api()).post(
        `/api/v1/enrollments/${enrollment.body.id}/modules/${moduleId}/complete`,
      ),
    ).expect(201);
    await admin(
      request(api()).patch(`/api/v1/enrollments/${enrollment.body.id}/cancel`),
    ).expect(200);
    await admin(
      request(api())
        .patch(`/api/v1/courses/${courseId}/modules/${moduleId}`)
        .send({ title: 'Locked structure edit' }),
    )
      .expect(409)
      .expect(({ body }) => expect(body.code).toBe('COURSE_STRUCTURE_LOCKED'));

    const path = await admin(
      request(api())
        .post('/api/v1/learning-paths')
        .send({ name: 'Lifecycle path', description: 'Path lifecycle' }),
    ).expect(201);
    const pathId = path.body.id as string;
    await admin(request(api()).get('/api/v1/learning-paths?page=1&limit=10'))
      .expect(200)
      .expect(({ body }) => expect(body.meta.totalItems).toBeGreaterThan(1));
    await admin(
      request(api())
        .patch(`/api/v1/learning-paths/${pathId}`)
        .send({ description: 'Updated path' }),
    ).expect(200);
    await admin(request(api()).post(`/api/v1/learning-paths/${pathId}/publish`))
      .expect(409)
      .expect(({ body }) => expect(body.code).toBe('LEARNING_PATH_EMPTY'));
    await admin(
      request(api())
        .post(`/api/v1/learning-paths/${pathId}/courses`)
        .send({ courseId: IDS.seedCourse, sequenceNumber: 1 }),
    ).expect(201);
    await admin(
      request(api())
        .patch(`/api/v1/learning-paths/${pathId}/courses/${IDS.seedCourse}`)
        .send({ sequenceNumber: 2 }),
    ).expect(200);
    await admin(
      request(api()).delete(
        `/api/v1/learning-paths/${pathId}/courses/${IDS.seedCourse}`,
      ),
    ).expect(204);
    await admin(
      request(api())
        .post(`/api/v1/learning-paths/${pathId}/courses`)
        .send({ courseId: IDS.seedCourse, sequenceNumber: 1 }),
    ).expect(201);
    await admin(
      request(api()).post(`/api/v1/learning-paths/${pathId}/publish`),
    ).expect(201);
    const assignment = await admin(
      request(api())
        .post('/api/v1/learning-path-enrollments')
        .send({ learningPathId: pathId, employeeId }),
    ).expect(201);
    await admin(
      request(api())
        .post('/api/v1/learning-path-enrollments')
        .send({ learningPathId: pathId, employeeId }),
    ).expect(409);
    await admin(
      request(api())
        .post(`/api/v1/learning-paths/${pathId}/courses`)
        .send({ courseId, sequenceNumber: 2 }),
    )
      .expect(409)
      .expect(({ body }) =>
        expect(body.code).toBe('LEARNING_PATH_STRUCTURE_LOCKED'),
      );
    await admin(
      request(api()).get(
        `/api/v1/learning-path-enrollments?employeeId=${employeeId}&learningPathId=${pathId}`,
      ),
    )
      .expect(200)
      .expect(({ body }) => expect(body.data).toHaveLength(1));
    await admin(
      request(api()).get(
        `/api/v1/learning-path-enrollments/${assignment.body.id}`,
      ),
    )
      .expect(200)
      .expect(({ body }) =>
        expect(body.courses[0].progressStatus).toBe('UNLOCKED'),
      );
    await admin(
      request(api()).post(
        `/api/v1/learning-path-enrollments/${assignment.body.id}/courses/${IDS.seedCourse}/enroll`,
      ),
    ).expect(201);
    await admin(
      request(api()).delete(`/api/v1/learning-paths/${pathId}`),
    ).expect(409);

    const enrollmentRepo = db.getRepository(EnrollmentEntity);
    const certificateRepo = db.getRepository(CertificateEntity);
    const certificateDates = [
      ['CERT-LIFE-VALID', '2026-01-01T00:00:00Z', '2026-09-01T00:00:00Z'],
      ['CERT-LIFE-SOON', '2026-01-01T00:00:00Z', '2026-08-10T00:00:00Z'],
      ['CERT-LIFE-EXPIRED', '2026-01-01T00:00:00Z', '2026-07-01T00:00:00Z'],
    ] as const;
    const certificateIds: string[] = [];
    for (const [certificateNumber, issuedAt, expiresAt] of certificateDates) {
      const passed = await enrollmentRepo.save({
        employeeId,
        courseId: IDS.seedCourse,
        status: EnrollmentStatus.PASSED,
        learningPathEnrollmentId: null,
        learningPathCourseId: null,
        reenrollmentOfId: null,
        enrolledAt: new Date(issuedAt),
        readyAt: new Date(issuedAt),
        passedAt: new Date(issuedAt),
        cancelledAt: null,
      });
      const certificate = await certificateRepo.save({
        certificateNumber,
        employeeId,
        courseId: IDS.seedCourse,
        enrollmentId: passed.id,
        issuedAt: new Date(issuedAt),
        expiresAt: new Date(expiresAt),
      });
      certificateIds.push(certificate.id);
    }

    for (const status of ['VALID', 'EXPIRING_SOON', 'EXPIRED']) {
      await admin(
        request(api()).get(
          `/api/v1/certificates?employeeId=${employeeId}&courseId=${IDS.seedCourse}&status=${status}&asOf=2026-07-20T00:00:00.000Z`,
        ),
      )
        .expect(200)
        .expect(({ body }) => expect(body.data).toHaveLength(1));
    }
    await request(api())
      .get(`/api/v1/certificates/${certificateIds[0]}`)
      .set('Authorization', `Bearer ${learnerToken}`)
      .expect(403);
    await admin(
      request(api()).get(`/api/v1/employees/${employeeId}/certificates`),
    )
      .expect(200)
      .expect(({ body }) => expect(body.data).toHaveLength(3));

    await admin(request(api()).post('/api/v1/certificate-alerts/run')).expect(
      201,
    );
    const alerts = await admin(
      request(api()).get(
        `/api/v1/certificate-alerts?employeeId=${employeeId}&status=PENDING&alertType=EXPIRED`,
      ),
    ).expect(200);
    expect(alerts.body.data).toHaveLength(1);
    const alertId = alerts.body.data[0].id as string;
    await admin(
      request(api()).patch(`/api/v1/certificate-alerts/${alertId}/read`),
    ).expect(200);
    await admin(
      request(api()).patch(`/api/v1/certificate-alerts/${alertId}/read`),
    )
      .expect(200)
      .expect(({ body }) => expect(body.status).toBe('READ'));
    await request(api())
      .patch(`/api/v1/certificate-alerts/${alertId}/read`)
      .set('Authorization', `Bearer ${learnerToken}`)
      .expect(403);

    await admin(
      request(api()).get(
        `/api/v1/reports/compliance/by-area?courseId=${IDS.seedCourse}&asOf=2026-07-20T00:00:00.000Z&page=1&limit=10`,
      ),
    )
      .expect(200)
      .expect(({ body }) => {
        const operations = body.data.find(
          (row: { areaId: string }) => row.areaId === IDS.operationsArea,
        );
        expect(operations.validCertificateEmployees).toBe(1);
      });
    await admin(
      request(api()).get(
        `/api/v1/reports/compliance/by-area/${IDS.operationsArea}?courseId=${IDS.seedCourse}&asOf=2026-07-20T00:00:00.000Z`,
      ),
    )
      .expect(200)
      .expect(({ body }) => expect(body.data[0].status).toBe('VALID'));
    await admin(
      request(api()).get(
        '/api/v1/reports/compliance/by-area/00000000-0000-4000-8000-000000000099',
      ),
    ).expect(404);
  });
});
