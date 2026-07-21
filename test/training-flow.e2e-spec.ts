import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { hash } from 'bcrypt';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import {
  UserEntity,
  UserRole,
} from '../src/auth/entities/user.entity/user.entity';
import { configureApplication } from '../src/configure-application';

describe('Enrollment, assessment, and certification flow (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApplication(app);
    await app.init();
    dataSource = app.get(DataSource);
    await dataSource.query(
      'TRUNCATE TABLE areas, job_levels, users, courses, learning_paths RESTART IDENTITY CASCADE',
    );
    await dataSource.getRepository(UserEntity).save({
      email: 'admin@example.com',
      passwordHash: await hash('AdminPass123!', 4),
      role: UserRole.ADMIN,
      isActive: true,
      lastLoginAt: null,
    });
  });

  afterAll(async () => app.close());

  it('runs login → setup → enrollment → progress → pass → certificate', async () => {
    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@example.com', password: 'AdminPass123!' })
      .expect(201);
    const admin = adminLogin.body.accessToken as string;

    const area = await request(app.getHttpServer())
      .post('/api/v1/areas')
      .set('Authorization', `Bearer ${admin}`)
      .send({ name: 'Operations' })
      .expect(201);
    const level = await request(app.getHttpServer())
      .post('/api/v1/job-levels')
      .set('Authorization', `Bearer ${admin}`)
      .send({ name: 'Analyst', rankOrder: 1 })
      .expect(201);

    const employee = await request(app.getHttpServer())
      .post('/api/v1/employees')
      .set('Authorization', `Bearer ${admin}`)
      .send({
        email: 'learner@example.com',
        password: 'LearnerPass123!',
        employeeCode: 'EMP-001',
        firstName: 'Ada',
        lastName: 'Lovelace',
        areaId: area.body.id,
        jobLevelId: level.body.id,
        hireDate: '2026-01-15',
      })
      .expect(201);
    expect(employee.body).not.toHaveProperty('passwordHash');

    const employeeLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'learner@example.com', password: 'LearnerPass123!' })
      .expect(201);
    const learner = employeeLogin.body.accessToken as string;

    const course = await request(app.getHttpServer())
      .post('/api/v1/courses')
      .set('Authorization', `Bearer ${admin}`)
      .send({
        code: 'API-101',
        title: 'API Foundations',
        description: 'REST fundamentals',
        estimatedDurationMinutes: 60,
        certificateValidityDays: 365,
        isMandatory: true,
      })
      .expect(201);

    const module = await request(app.getHttpServer())
      .post(`/api/v1/courses/${course.body.id}/modules`)
      .set('Authorization', `Bearer ${admin}`)
      .send({
        title: 'HTTP Semantics',
        sequenceNumber: 1,
        estimatedDurationMinutes: 60,
        isRequired: true,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/modules/${module.body.id}/contents`)
      .set('Authorization', `Bearer ${admin}`)
      .send({
        title: 'Reading',
        contentType: 'TEXT',
        body: 'HTTP methods and status codes.',
        sequenceNumber: 1,
      })
      .expect(201);

    const assessment = await request(app.getHttpServer())
      .post(`/api/v1/courses/${course.body.id}/assessments`)
      .set('Authorization', `Bearer ${admin}`)
      .send({ title: 'Final assessment', passingScore: 70 })
      .expect(201);

    const question = await request(app.getHttpServer())
      .post(`/api/v1/assessments/${assessment.body.id}/questions`)
      .set('Authorization', `Bearer ${admin}`)
      .send({
        prompt: 'Which method retrieves a resource?',
        questionType: 'SINGLE_CHOICE',
        points: 10,
        sequenceNumber: 1,
        options: [
          { optionText: 'GET', isCorrect: true, sequenceNumber: 1 },
          { optionText: 'DELETE', isCorrect: false, sequenceNumber: 2 },
        ],
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/assessments/${assessment.body.id}/publish`)
      .set('Authorization', `Bearer ${admin}`)
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/v1/courses/${course.body.id}/publish`)
      .set('Authorization', `Bearer ${admin}`)
      .expect(201);

    const path = await request(app.getHttpServer())
      .post('/api/v1/learning-paths')
      .set('Authorization', `Bearer ${admin}`)
      .send({ name: 'API learning route' })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/v1/learning-paths/${path.body.id}/courses`)
      .set('Authorization', `Bearer ${admin}`)
      .send({ courseId: course.body.id, sequenceNumber: 1 })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/v1/learning-paths/${path.body.id}/publish`)
      .set('Authorization', `Bearer ${admin}`)
      .expect(201);
    const pathAssignment = await request(app.getHttpServer())
      .post('/api/v1/learning-path-enrollments')
      .set('Authorization', `Bearer ${admin}`)
      .send({ learningPathId: path.body.id, employeeId: employee.body.id })
      .expect(201);
    const enrollment = await request(app.getHttpServer())
      .post(
        `/api/v1/learning-path-enrollments/${pathAssignment.body.id}/courses/${course.body.id}/enroll`,
      )
      .set('Authorization', `Bearer ${admin}`)
      .expect(201);
    expect(enrollment.body.moduleProgress).toHaveLength(1);
    expect(enrollment.body.moduleProgress[0].status).toBe('PENDING');

    await request(app.getHttpServer())
      .post(`/api/v1/enrollments/${enrollment.body.id}/assessment-attempts`)
      .set('Authorization', `Bearer ${learner}`)
      .send({
        answers: [
          {
            questionId: question.body.id,
            selectedOptionIds: [question.body.options[0].id],
          },
        ],
      })
      .expect(409)
      .expect(({ body }) => expect(body.code).toBe('MODULES_INCOMPLETE'));

    await request(app.getHttpServer())
      .post(
        `/api/v1/enrollments/${enrollment.body.id}/modules/${module.body.id}/complete`,
      )
      .set('Authorization', `Bearer ${learner}`)
      .expect(201)
      .expect(({ body }) => expect(body.status).toBe('READY_FOR_ASSESSMENT'));

    const publicAssessment = await request(app.getHttpServer())
      .get(`/api/v1/enrollments/${enrollment.body.id}/assessment`)
      .set('Authorization', `Bearer ${learner}`)
      .expect(200);
    expect(JSON.stringify(publicAssessment.body)).not.toContain('isCorrect');

    const attempt = await request(app.getHttpServer())
      .post(`/api/v1/enrollments/${enrollment.body.id}/assessment-attempts`)
      .set('Authorization', `Bearer ${learner}`)
      .send({
        answers: [
          {
            questionId: question.body.id,
            selectedOptionIds: [question.body.options[0].id],
          },
        ],
      })
      .expect(201);
    expect(attempt.body).toMatchObject({
      attemptNumber: 1,
      score: 100,
      passed: true,
      enrollmentStatus: 'PASSED',
    });
    expect(attempt.body.certificate.certificateNumber).toEqual(
      expect.any(String),
    );

    await request(app.getHttpServer())
      .get(`/api/v1/certificates/${attempt.body.certificate.id}`)
      .set('Authorization', `Bearer ${learner}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe('VALID');
        expect(body.employeeId).toBe(employee.body.id);
      });

    await request(app.getHttpServer())
      .get(`/api/v1/learning-path-enrollments/${pathAssignment.body.id}`)
      .set('Authorization', `Bearer ${learner}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe('COMPLETED');
        expect(body.courses[0].progressStatus).toBe('PASSED');
      });
  });
});
