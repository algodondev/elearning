import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
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

describe('Authentication security boundaries (e2e)', () => {
  let app: INestApplication;
  let db: DataSource;
  let adminToken: string;
  let employeeToken: string;
  let inactiveToken: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApplication(app);
    await app.init();
    db = app.get(DataSource);
    await db.query('TRUNCATE TABLE users RESTART IDENTITY CASCADE');
    const passwordHash = await hash('SecurityPass123!', 4);
    const [admin, employee, inactive] = await db
      .getRepository(UserEntity)
      .save([
        {
          email: 'security-admin@example.com',
          passwordHash,
          role: UserRole.ADMIN,
          isActive: true,
          lastLoginAt: null,
        },
        {
          email: 'security-employee@example.com',
          passwordHash,
          role: UserRole.EMPLOYEE,
          isActive: true,
          lastLoginAt: null,
        },
        {
          email: 'security-inactive@example.com',
          passwordHash,
          role: UserRole.ADMIN,
          isActive: false,
          lastLoginAt: null,
        },
      ]);
    const jwt = app.get(JwtService);
    adminToken = await jwt.signAsync({ sub: admin.id, role: admin.role });
    employeeToken = await jwt.signAsync({
      sub: employee.id,
      role: employee.role,
    });
    inactiveToken = await jwt.signAsync({
      sub: inactive.id,
      role: inactive.role,
    });
  });

  afterAll(async () => app.close());

  it('distinguishes missing/invalid authentication, inactive identity, and wrong role', async () => {
    await request(app.getHttpServer()).get('/api/v1/auth/profile').expect(401);
    await request(app.getHttpServer())
      .get('/api/v1/auth/profile')
      .set('Authorization', 'Bearer not-a-token')
      .expect(401);
    await request(app.getHttpServer())
      .get('/api/v1/auth/profile')
      .set('Authorization', `Bearer ${inactiveToken}`)
      .expect(401);
    await request(app.getHttpServer())
      .get('/api/v1/reports/compliance/by-area')
      .set('Authorization', `Bearer ${employeeToken}`)
      .expect(403);
    await request(app.getHttpServer())
      .get('/api/v1/reports/compliance/by-area')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });

  it('rate limits repeated login attempts', async () => {
    const statuses: number[] = [];
    for (let index = 0; index < 7; index += 1) {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'missing@example.com',
          password: 'WrongPassword123!',
        });
      statuses.push(response.status);
      if (response.status === 429) break;
    }
    expect(statuses).toContain(401);
    expect(statuses).toContain(429);
  });
});
