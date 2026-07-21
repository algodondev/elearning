import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { configureApplication } from '../src/configure-application';

describe('Database integrity contract (integration)', () => {
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

  it('has the required partial and case-insensitive unique indexes', async () => {
    const rows = await db.query<{ indexname: string }[]>(
      `SELECT indexname
       FROM pg_indexes
       WHERE schemaname = 'public'
         AND indexname = ANY($1::text[])`,
      [
        [
          'UQ_users_email_ci',
          'UQ_areas_name_ci',
          'UQ_job_levels_name_ci',
          'UQ_employees_code_ci',
          'UQ_courses_code_ci',
          'UQ_learning_paths_name_ci',
          'UQ_enrollments_active_employee_course',
          'UQ_assessments_one_published_per_course',
        ],
      ],
    );
    expect(rows.map((row) => row.indexname).sort()).toEqual(
      [
        'UQ_users_email_ci',
        'UQ_areas_name_ci',
        'UQ_job_levels_name_ci',
        'UQ_employees_code_ci',
        'UQ_courses_code_ci',
        'UQ_learning_paths_name_ci',
        'UQ_enrollments_active_employee_course',
        'UQ_assessments_one_published_per_course',
      ].sort(),
    );
  });

  it('has database checks for paired path context and content payload type', async () => {
    const rows = await db.query<{ conname: string }[]>(
      `SELECT conname
       FROM pg_constraint
       WHERE conname = ANY($1::text[])`,
      [
        [
          'CHK_enrollments_learning_path_context',
          'CHK_module_contents_payload',
        ],
      ],
    );
    expect(rows.map((row) => row.conname).sort()).toEqual(
      [
        'CHK_enrollments_learning_path_context',
        'CHK_module_contents_payload',
      ].sort(),
    );
  });
});
