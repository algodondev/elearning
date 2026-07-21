import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { hash } from 'bcrypt';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import {
  AssessmentStatus,
  AssessmentEntity,
} from '../src/assessments/entities/assessment.entity/assessment.entity';
import { QuestionOptionEntity } from '../src/assessments/entities/question-option.entity/question-option.entity';
import {
  QuestionEntity,
  QuestionType,
} from '../src/assessments/entities/question.entity/question.entity';
import {
  UserEntity,
  UserRole,
} from '../src/auth/entities/user.entity/user.entity';
import { CertificateEntity } from '../src/certificates/entities/certificate.entity/certificate.entity';
import { configureApplication } from '../src/configure-application';
import { CourseModuleEntity } from '../src/courses/entities/course-module.entity/course-module.entity';
import {
  CourseEntity,
  CourseStatus,
} from '../src/courses/entities/course.entity/course.entity';
import { EmployeeEntity } from '../src/employees/entities/employee.entity/employee.entity';
import {
  EnrollmentEntity,
  EnrollmentStatus,
} from '../src/enrollments/entities/enrollment.entity/enrollment.entity';
import {
  ModuleProgressEntity,
  ModuleProgressStatus,
} from '../src/enrollments/entities/module-progress.entity/module-progress.entity';
import { AreaEntity } from '../src/organization/entities/area.entity/area.entity';
import { JobLevelEntity } from '../src/organization/entities/job-level.entity/job-level.entity';

describe('Mandatory business rules (e2e)', () => {
  let app: INestApplication;
  let db: DataSource;
  let adminToken: string;
  let learnerToken: string;
  let employee: EmployeeEntity;
  let secondEmployee: EmployeeEntity;
  let course: CourseEntity;
  let secondCourse: CourseEntity;
  let enrollment: EnrollmentEntity;
  let wrongOptionId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApplication(app);
    await app.init();
    db = app.get(DataSource);
    await db.query(
      'TRUNCATE TABLE areas, job_levels, users, courses RESTART IDENTITY CASCADE',
    );

    const area = await db
      .getRepository(AreaEntity)
      .save({ name: 'Compliance', description: null, isActive: true });
    const level = await db.getRepository(JobLevelEntity).save({
      name: 'Associate',
      rankOrder: 1,
      description: null,
      isActive: true,
    });
    const admin = await db.getRepository(UserEntity).save({
      email: 'admin@example.com',
      passwordHash: await hash('AdminPass123!', 4),
      role: UserRole.ADMIN,
      isActive: true,
      lastLoginAt: null,
    });
    const learnerUser = await db.getRepository(UserEntity).save({
      email: 'learner@example.com',
      passwordHash: await hash('LearnerPass123!', 4),
      role: UserRole.EMPLOYEE,
      isActive: true,
      lastLoginAt: null,
    });
    const secondUser = await db.getRepository(UserEntity).save({
      email: 'second@example.com',
      passwordHash: await hash('SecondPass123!', 4),
      role: UserRole.EMPLOYEE,
      isActive: true,
      lastLoginAt: null,
    });
    employee = await db.getRepository(EmployeeEntity).save({
      userId: learnerUser.id,
      employeeCode: 'EMP-001',
      firstName: 'Grace',
      lastName: 'Hopper',
      areaId: area.id,
      jobLevelId: level.id,
      hireDate: '2026-01-01',
      isActive: true,
    });
    secondEmployee = await db.getRepository(EmployeeEntity).save({
      userId: secondUser.id,
      employeeCode: 'EMP-002',
      firstName: 'Alan',
      lastName: 'Turing',
      areaId: area.id,
      jobLevelId: level.id,
      hireDate: '2026-01-01',
      isActive: true,
    });
    course = await db.getRepository(CourseEntity).save({
      code: 'SEC-101',
      title: 'Security',
      description: 'Security basics',
      estimatedDurationMinutes: 30,
      isMandatory: true,
      certificateValidityDays: 365,
      status: CourseStatus.PUBLISHED,
    });
    secondCourse = await db.getRepository(CourseEntity).save({
      code: 'SEC-201',
      title: 'Advanced Security',
      description: 'Advanced',
      estimatedDurationMinutes: 30,
      isMandatory: false,
      certificateValidityDays: 365,
      status: CourseStatus.PUBLISHED,
    });
    const module = await db.getRepository(CourseModuleEntity).save({
      courseId: course.id,
      title: 'Required',
      description: null,
      sequenceNumber: 1,
      estimatedDurationMinutes: 30,
      isRequired: true,
    });
    const assessment = await db.getRepository(AssessmentEntity).save({
      courseId: course.id,
      version: 1,
      title: 'Exam',
      instructions: null,
      passingScore: 70,
      status: AssessmentStatus.PUBLISHED,
      publishedAt: new Date(),
    });
    const question = await db.getRepository(QuestionEntity).save({
      assessmentId: assessment.id,
      prompt: 'Correct?',
      questionType: QuestionType.SINGLE_CHOICE,
      points: 10,
      sequenceNumber: 1,
      isActive: true,
    });
    await db.getRepository(QuestionOptionEntity).save({
      questionId: question.id,
      optionText: 'Yes',
      isCorrect: true,
      sequenceNumber: 1,
    });
    const wrong = await db.getRepository(QuestionOptionEntity).save({
      questionId: question.id,
      optionText: 'No',
      isCorrect: false,
      sequenceNumber: 2,
    });
    wrongOptionId = wrong.id;
    enrollment = await db.getRepository(EnrollmentEntity).save({
      employeeId: employee.id,
      courseId: course.id,
      status: EnrollmentStatus.READY_FOR_ASSESSMENT,
      learningPathEnrollmentId: null,
      learningPathCourseId: null,
      reenrollmentOfId: null,
      enrolledAt: new Date(),
      readyAt: new Date(),
      passedAt: null,
      cancelledAt: null,
    });
    await db.getRepository(ModuleProgressEntity).save({
      enrollmentId: enrollment.id,
      moduleId: module.id,
      status: ModuleProgressStatus.COMPLETED,
      completedAt: new Date(),
    });

    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: admin.email, password: 'AdminPass123!' })
      .expect(201);
    adminToken = adminLogin.body.accessToken as string;
    const learnerLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: learnerUser.email, password: 'LearnerPass123!' })
      .expect(201);
    learnerToken = learnerLogin.body.accessToken as string;
  });

  afterAll(async () => app.close());

  it('enforces three failed attempts and requires a fresh re-enrollment', async () => {
    const question = await db.getRepository(QuestionEntity).findOneByOrFail({
      assessmentId: (
        await db
          .getRepository(AssessmentEntity)
          .findOneByOrFail({ courseId: course.id })
      ).id,
    });
    for (let attemptNumber = 1; attemptNumber <= 3; attemptNumber += 1) {
      await request(app.getHttpServer())
        .post(`/api/v1/enrollments/${enrollment.id}/assessment-attempts`)
        .set('Authorization', `Bearer ${learnerToken}`)
        .send({
          answers: [
            { questionId: question.id, selectedOptionIds: [wrongOptionId] },
          ],
        })
        .expect(201)
        .expect(({ body }) => expect(body.attemptNumber).toBe(attemptNumber));
    }

    await request(app.getHttpServer())
      .post(`/api/v1/enrollments/${enrollment.id}/assessment-attempts`)
      .set('Authorization', `Bearer ${learnerToken}`)
      .send({
        answers: [
          { questionId: question.id, selectedOptionIds: [wrongOptionId] },
        ],
      })
      .expect(409);

    const reEnrollment = await request(app.getHttpServer())
      .post(`/api/v1/enrollments/${enrollment.id}/re-enroll`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);
    expect(reEnrollment.body).toMatchObject({
      status: EnrollmentStatus.ENROLLED,
      reenrollmentOfId: enrollment.id,
    });
    expect(reEnrollment.body.moduleProgress[0].status).toBe(
      ModuleProgressStatus.PENDING,
    );
  });

  it('blocks the next learning-path course until the previous course is passed', async () => {
    const path = await request(app.getHttpServer())
      .post('/api/v1/learning-paths')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Security Path',
        description: 'Sequential security learning',
      })
      .expect(201);
    for (const [courseId, sequenceNumber] of [
      [course.id, 1],
      [secondCourse.id, 2],
    ] as const) {
      await request(app.getHttpServer())
        .post(`/api/v1/learning-paths/${path.body.id}/courses`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ courseId, sequenceNumber })
        .expect(201);
    }
    await request(app.getHttpServer())
      .post(`/api/v1/learning-paths/${path.body.id}/publish`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);
    const assignment = await request(app.getHttpServer())
      .post('/api/v1/learning-path-enrollments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ learningPathId: path.body.id, employeeId: employee.id })
      .expect(201);

    await request(app.getHttpServer())
      .post(
        `/api/v1/learning-path-enrollments/${assignment.body.id}/courses/${secondCourse.id}/enroll`,
      )
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(409)
      .expect(({ body }) =>
        expect(body.code).toBe('LEARNING_PATH_PREREQUISITE_NOT_PASSED'),
      );

    await db.getRepository(EnrollmentEntity).update(enrollment.id, {
      status: EnrollmentStatus.PASSED,
      passedAt: new Date(),
    });
    const unlocked = await request(app.getHttpServer())
      .post(
        `/api/v1/learning-path-enrollments/${assignment.body.id}/courses/${secondCourse.id}/enroll`,
      )
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);
    expect(unlocked.body.learningPathEnrollmentId).toBe(assignment.body.id);
  });

  it('generates idempotent expiry alerts and distinguishes expired compliance', async () => {
    const expiredCertificate = await db.getRepository(CertificateEntity).save({
      certificateNumber: 'CERT-EXPIRED',
      employeeId: employee.id,
      courseId: course.id,
      enrollmentId: enrollment.id,
      issuedAt: new Date('2025-01-01T00:00:00Z'),
      expiresAt: new Date('2026-01-01T00:00:00Z'),
    });
    await request(app.getHttpServer())
      .post('/api/v1/certificate-alerts/run')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);
    await request(app.getHttpServer())
      .post('/api/v1/certificate-alerts/run')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);
    const alerts = await request(app.getHttpServer())
      .get('/api/v1/certificate-alerts')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(
      alerts.body.data.filter(
        (item: { certificateId: string }) =>
          item.certificateId === expiredCertificate.id,
      ),
    ).toHaveLength(1);
    expect(alerts.body.data[0].alertType).toBe('EXPIRED');

    const report = await request(app.getHttpServer())
      .get('/api/v1/reports/compliance/by-area')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const row = report.body.data.find(
      (item: { courseId: string }) => item.courseId === course.id,
    );
    expect(row).toMatchObject({
      applicableActiveEmployees: 2,
      validCertificateEmployees: 0,
      expiredOnlyEmployees: 1,
      neverCertifiedEmployees: 1,
      compliancePercentage: 0,
    });
    expect(secondEmployee.id).toEqual(expect.any(String));
  });
});
