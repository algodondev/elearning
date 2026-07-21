import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource, In } from 'typeorm';
import { AppModule } from '../src/app.module';
import { AssessmentAttemptEntity } from '../src/assessments/entities/assessment-attempt.entity/assessment-attempt.entity';
import { CertificateEntity } from '../src/certificates/entities/certificate.entity/certificate.entity';
import { configureApplication } from '../src/configure-application';
import { seedDevelopmentDatabase } from '../src/database/seeds/development.seed/development.seed';
import {
  EnrollmentEntity,
  EnrollmentStatus,
} from '../src/enrollments/entities/enrollment.entity/enrollment.entity';

const EMPLOYEE_ID = '40000000-0000-4000-8000-000000000001';
const COURSE_ID = '50000000-0000-4000-8000-000000000001';
const MODULE_ID = '60000000-0000-4000-8000-000000000001';
const QUESTION_ID = '80000000-0000-4000-8000-000000000001';
const CORRECT_OPTION_ID = '90000000-0000-4000-8000-000000000001';

describe('Concurrent enrollment and attempt integrity (e2e)', () => {
  let app: INestApplication;
  let db: DataSource;
  let adminToken: string;
  let learnerToken: string;

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
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'admin@elearning.local', password: 'DevOnly123!' })
        .expect(201)
    ).body.accessToken as string;
    learnerToken = (
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'learner@elearning.local', password: 'DevOnly123!' })
        .expect(201)
    ).body.accessToken as string;
  });

  afterAll(async () => app.close());

  it('allows only one active enrollment under simultaneous requests', async () => {
    const results = await Promise.all(
      [1, 2].map(() =>
        request(app.getHttpServer())
          .post('/api/v1/enrollments')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ employeeId: EMPLOYEE_ID, courseId: COURSE_ID }),
      ),
    );
    expect(results.map((result) => result.status).sort()).toEqual([201, 409]);
    await expect(
      db.getRepository(EnrollmentEntity).countBy({
        employeeId: EMPLOYEE_ID,
        courseId: COURSE_ID,
        status: In([
          EnrollmentStatus.ENROLLED,
          EnrollmentStatus.IN_PROGRESS,
          EnrollmentStatus.READY_FOR_ASSESSMENT,
        ]),
      }),
    ).resolves.toBe(1);
  });

  it('keeps completion idempotent and issues one attempt/certificate under simultaneous submissions', async () => {
    const enrollment = await db
      .getRepository(EnrollmentEntity)
      .findOneByOrFail({
        employeeId: EMPLOYEE_ID,
        courseId: COURSE_ID,
      });
    const completions = await Promise.all(
      [1, 2].map(() =>
        request(app.getHttpServer())
          .post(
            `/api/v1/enrollments/${enrollment.id}/modules/${MODULE_ID}/complete`,
          )
          .set('Authorization', `Bearer ${learnerToken}`),
      ),
    );
    expect(completions.map((result) => result.status)).toEqual([201, 201]);

    const attempts = await Promise.all(
      [1, 2].map(() =>
        request(app.getHttpServer())
          .post(`/api/v1/enrollments/${enrollment.id}/assessment-attempts`)
          .set('Authorization', `Bearer ${learnerToken}`)
          .send({
            answers: [
              {
                questionId: QUESTION_ID,
                selectedOptionIds: [CORRECT_OPTION_ID],
              },
            ],
          }),
      ),
    );
    expect(attempts.map((result) => result.status).sort()).toEqual([201, 409]);
    await expect(
      db.getRepository(AssessmentAttemptEntity).countBy({
        enrollmentId: enrollment.id,
      }),
    ).resolves.toBe(1);
    await expect(
      db.getRepository(CertificateEntity).countBy({
        enrollmentId: enrollment.id,
      }),
    ).resolves.toBe(1);
  });
});
