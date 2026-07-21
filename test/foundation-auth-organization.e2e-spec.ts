import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { hash } from 'bcrypt';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import {
  UserEntity,
  UserRole,
} from '../src/auth/entities/user.entity/user.entity';
import { ApiExceptionFilter } from '../src/common/filters/api-exception.filter';
import { RequestIdInterceptor } from '../src/common/interceptors/request-id.interceptor';

describe('Foundation, authentication, and organization (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.useGlobalInterceptors(new RequestIdInterceptor());
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();
    dataSource = app.get(DataSource);
    await dataSource.query(
      'TRUNCATE TABLE areas, job_levels, users RESTART IDENTITY CASCADE',
    );
    await dataSource.getRepository(UserEntity).save({
      email: 'admin@example.com',
      passwordHash: await hash('AdminPass123!', 4),
      role: UserRole.ADMIN,
      isActive: true,
      lastLoginAt: null,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('reports database readiness', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200);
    expect(response.body).toMatchObject({ status: 'ok', database: 'up' });
  });

  it('authenticates an active user and protects the profile', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'ADMIN@EXAMPLE.COM', password: 'AdminPass123!' })
      .expect(201);

    expect(login.body).toMatchObject({
      tokenType: 'Bearer',
      user: { email: 'admin@example.com', role: UserRole.ADMIN },
    });
    expect(login.body.accessToken).toEqual(expect.any(String));
    adminToken = login.body.accessToken as string;

    await request(app.getHttpServer()).get('/api/v1/auth/profile').expect(401);
    await request(app.getHttpServer())
      .get('/api/v1/auth/profile')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body).not.toHaveProperty('passwordHash');
        expect(body.email).toBe('admin@example.com');
      });
  });

  it('rejects invalid credentials without revealing account existence', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'missing@example.com', password: 'WrongPassword123!' })
      .expect(401);

    expect(response.body.message).toBe('Invalid credentials.');
  });

  it('creates, lists, updates, and archives an area', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/areas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Engineering', description: 'Product engineering' })
      .expect(201);

    const areaId = created.body.id as string;
    expect(created.body).toMatchObject({ name: 'Engineering', isActive: true });

    await request(app.getHttpServer())
      .get('/api/v1/areas?page=1&limit=10')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.meta.totalItems).toBe(1);
        expect(body.data[0].id).toBe(areaId);
      });

    await request(app.getHttpServer())
      .patch(`/api/v1/areas/${areaId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ description: 'Updated' })
      .expect(200)
      .expect(({ body }) => expect(body.description).toBe('Updated'));

    await request(app.getHttpServer())
      .delete(`/api/v1/areas/${areaId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(204);
  });

  it('rejects unknown DTO properties', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/areas')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('X-Request-Id', 'test-request-id')
      .send({ name: 'Finance', role: 'ADMIN' })
      .expect(400);

    expect(response.body).toMatchObject({
      statusCode: 400,
      code: 'VALIDATION_FAILED',
      requestId: 'test-request-id',
      path: '/api/v1/areas',
    });
  });
});
