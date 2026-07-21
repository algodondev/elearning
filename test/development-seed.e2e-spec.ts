import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { UserEntity } from '../src/auth/entities/user.entity/user.entity';
import { configureApplication } from '../src/configure-application';
import { CourseEntity } from '../src/courses/entities/course.entity/course.entity';
import { seedDevelopmentDatabase } from '../src/database/seeds/development.seed/development.seed';
import { LearningPathEntity } from '../src/learning-paths/entities/learning-path.entity/learning-path.entity';

describe('Development seed (integration)', () => {
  let app: INestApplication;
  let db: DataSource;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApplication(app);
    await app.init();
    db = app.get(DataSource);
  });

  afterAll(async () => app.close());

  it('is repeatable and creates one login per role plus a published course/path', async () => {
    await seedDevelopmentDatabase(db);
    await seedDevelopmentDatabase(db);

    await expect(db.getRepository(UserEntity).count()).resolves.toBe(3);
    await expect(db.getRepository(CourseEntity).count()).resolves.toBe(1);
    await expect(db.getRepository(LearningPathEntity).count()).resolves.toBe(1);

    for (const [email, role] of [
      ['admin@elearning.local', 'ADMIN'],
      ['hr@elearning.local', 'HR_MANAGER'],
      ['learner@elearning.local', 'EMPLOYEE'],
    ]) {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email, password: 'DevOnly123!' })
        .expect(201)
        .expect(({ body }) => expect(body.user.role).toBe(role));
    }
  });
});
