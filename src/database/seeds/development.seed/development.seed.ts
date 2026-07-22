import 'dotenv/config';
import { hash } from 'bcrypt';
import { DataSource } from 'typeorm';
import {
  AssessmentEntity,
  AssessmentStatus,
} from '../../../assessments/entities/assessment.entity/assessment.entity';
import { QuestionOptionEntity } from '../../../assessments/entities/question-option.entity/question-option.entity';
import {
  QuestionEntity,
  QuestionType,
} from '../../../assessments/entities/question.entity/question.entity';
import {
  UserEntity,
  UserRole,
} from '../../../auth/entities/user.entity/user.entity';
import { CourseModuleEntity } from '../../../courses/entities/course-module.entity/course-module.entity';
import {
  CourseEntity,
  CourseStatus,
} from '../../../courses/entities/course.entity/course.entity';
import {
  ContentType,
  ModuleContentEntity,
} from '../../../courses/entities/module-content.entity/module-content.entity';
import { EmployeeEntity } from '../../../employees/entities/employee.entity/employee.entity';
import { LearningPathCourseEntity } from '../../../learning-paths/entities/learning-path-course.entity/learning-path-course.entity';
import {
  LearningPathEntity,
  LearningPathStatus,
} from '../../../learning-paths/entities/learning-path.entity/learning-path.entity';
import { AreaEntity } from '../../../organization/entities/area.entity/area.entity';
import { JobLevelEntity } from '../../../organization/entities/job-level.entity/job-level.entity';
import dataSource from '../../data-source/data-source';

const IDS = {
  operationsArea: '10000000-0000-4000-8000-000000000001',
  engineeringArea: '10000000-0000-4000-8000-000000000002',
  associateLevel: '20000000-0000-4000-8000-000000000001',
  managerLevel: '20000000-0000-4000-8000-000000000002',
  adminUser: '30000000-0000-4000-8000-000000000001',
  hrUser: '30000000-0000-4000-8000-000000000002',
  learnerUser: '30000000-0000-4000-8000-000000000003',
  learnerEmployee: '40000000-0000-4000-8000-000000000001',
  course: '50000000-0000-4000-8000-000000000001',
  courseModule: '60000000-0000-4000-8000-000000000001',
  moduleContent: '61000000-0000-4000-8000-000000000001',
  assessment: '70000000-0000-4000-8000-000000000001',
  question: '80000000-0000-4000-8000-000000000001',
  correctOption: '90000000-0000-4000-8000-000000000001',
  wrongOption: '90000000-0000-4000-8000-000000000002',
  learningPath: 'a0000000-0000-4000-8000-000000000001',
  learningPathCourse: 'b0000000-0000-4000-8000-000000000001',
} as const;

export async function seedDevelopmentDatabase(db: DataSource): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Development seed is disabled in production.');
  }
  const rounds = Number(process.env.BCRYPT_ROUNDS ?? 12);
  const passwordHash = await hash(
    process.env.SEED_PASSWORD ?? 'DevOnly123!',
    rounds,
  );
  const publishedAt = new Date('2026-07-20T12:00:00.000Z');

  await db.transaction(async (manager) => {
    await manager.query(
      'TRUNCATE TABLE areas, job_levels, users, courses, learning_paths RESTART IDENTITY CASCADE',
    );
    await manager.getRepository(AreaEntity).save([
      {
        id: IDS.operationsArea,
        name: 'Operations',
        description: 'Corporate operations and compliance.',
        isActive: true,
      },
      {
        id: IDS.engineeringArea,
        name: 'Engineering',
        description: 'Product and platform engineering.',
        isActive: true,
      },
    ]);
    await manager.getRepository(JobLevelEntity).save([
      {
        id: IDS.associateLevel,
        name: 'Associate',
        rankOrder: 1,
        description: 'Individual contributor.',
        isActive: true,
      },
      {
        id: IDS.managerLevel,
        name: 'Manager',
        rankOrder: 2,
        description: 'People manager.',
        isActive: true,
      },
    ]);
    await manager.getRepository(UserEntity).save([
      {
        id: IDS.adminUser,
        email: 'admin@elearning.local',
        passwordHash,
        role: UserRole.ADMIN,
        isActive: true,
        lastLoginAt: null,
      },
      {
        id: IDS.hrUser,
        email: 'hr@elearning.local',
        passwordHash,
        role: UserRole.HR_MANAGER,
        isActive: true,
        lastLoginAt: null,
      },
      {
        id: IDS.learnerUser,
        email: 'learner@elearning.local',
        passwordHash,
        role: UserRole.EMPLOYEE,
        isActive: true,
        lastLoginAt: null,
      },
    ]);
    await manager.getRepository(EmployeeEntity).save({
      id: IDS.learnerEmployee,
      userId: IDS.learnerUser,
      employeeCode: 'EMP-SEED-001',
      firstName: 'Ada',
      lastName: 'Lovelace',
      areaId: IDS.engineeringArea,
      jobLevelId: IDS.associateLevel,
      hireDate: '2026-01-15',
      isActive: true,
    });
    await manager.getRepository(CourseEntity).save({
      id: IDS.course,
      code: 'API-101',
      title: 'API Foundations',
      description: 'REST, HTTP semantics, validation, and API security.',
      estimatedDurationMinutes: 60,
      isMandatory: true,
      certificateValidityDays: 365,
      status: CourseStatus.PUBLISHED,
    });
    await manager.getRepository(CourseModuleEntity).save({
      id: IDS.courseModule,
      courseId: IDS.course,
      title: 'HTTP Semantics',
      description: 'Methods, status codes, and resource representations.',
      sequenceNumber: 1,
      estimatedDurationMinutes: 60,
      isRequired: true,
    });
    await manager.getRepository(ModuleContentEntity).save({
      id: IDS.moduleContent,
      moduleId: IDS.courseModule,
      title: 'REST reading',
      contentType: ContentType.TEXT,
      contentUrl: null,
      body: 'Review safe methods, idempotency, and status-code semantics.',
      sequenceNumber: 1,
    });
    await manager.getRepository(AssessmentEntity).save({
      id: IDS.assessment,
      courseId: IDS.course,
      version: 1,
      title: 'API Foundations assessment',
      instructions: 'Select the best answer.',
      passingScore: 70,
      status: AssessmentStatus.PUBLISHED,
      publishedAt,
    });
    await manager.getRepository(QuestionEntity).save({
      id: IDS.question,
      assessmentId: IDS.assessment,
      prompt: 'Which HTTP method retrieves a resource?',
      questionType: QuestionType.SINGLE_CHOICE,
      points: 10,
      sequenceNumber: 1,
      isActive: true,
    });
    await manager.getRepository(QuestionOptionEntity).save([
      {
        id: IDS.correctOption,
        questionId: IDS.question,
        optionText: 'GET',
        isCorrect: true,
        sequenceNumber: 1,
      },
      {
        id: IDS.wrongOption,
        questionId: IDS.question,
        optionText: 'DELETE',
        isCorrect: false,
        sequenceNumber: 2,
      },
    ]);
    await manager.getRepository(LearningPathEntity).save({
      id: IDS.learningPath,
      name: 'Backend Engineering Foundations',
      description: 'Sequential learning route for backend engineers.',
      status: LearningPathStatus.PUBLISHED,
    });
    await manager.getRepository(LearningPathCourseEntity).save({
      id: IDS.learningPathCourse,
      learningPathId: IDS.learningPath,
      courseId: IDS.course,
      sequenceNumber: 1,
    });
  });
}

async function run(): Promise<void> {
  await dataSource.initialize();
  try {
    await dataSource.runMigrations();
    await seedDevelopmentDatabase(dataSource);
    process.stdout.write(
      'Development seed complete. All seeded users use the configured SEED_PASSWORD.\n',
    );
  } finally {
    await dataSource.destroy();
  }
}

if (require.main === module) {
  void run();
}
