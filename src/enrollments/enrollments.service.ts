import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { UserRole } from '../auth/entities/user.entity/user.entity';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy/jwt.strategy';
import { paginate } from '../common/dto/pagination.dto/pagination.dto';
import { CourseModuleEntity } from '../courses/entities/course-module.entity/course-module.entity';
import {
  CourseEntity,
  CourseStatus,
} from '../courses/entities/course.entity/course.entity';
import { EmployeeEntity } from '../employees/entities/employee.entity/employee.entity';
import {
  CreateEnrollmentDto,
  ListEnrollmentsDto,
} from './dto/enrollment.dto/enrollment.dto';
import {
  EnrollmentEntity,
  EnrollmentStatus,
} from './entities/enrollment.entity/enrollment.entity';
import {
  ModuleProgressEntity,
  ModuleProgressStatus,
} from './entities/module-progress.entity/module-progress.entity';

@Injectable()
export class EnrollmentsService {
  private readonly activeStatuses = [
    EnrollmentStatus.ENROLLED,
    EnrollmentStatus.IN_PROGRESS,
    EnrollmentStatus.READY_FOR_ASSESSMENT,
  ];

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(EnrollmentEntity)
    private readonly enrollments: Repository<EnrollmentEntity>,
    @InjectRepository(EmployeeEntity)
    private readonly employees: Repository<EmployeeEntity>,
    @InjectRepository(CourseEntity)
    private readonly courses: Repository<CourseEntity>,
  ) {}

  async create(dto: CreateEnrollmentDto) {
    const [employee, course] = await Promise.all([
      this.employees.findOneBy({ id: dto.employeeId, isActive: true }),
      this.courses.findOneBy({
        id: dto.courseId,
        status: CourseStatus.PUBLISHED,
      }),
    ]);
    if (!employee) throw new ConflictException('Employee must be active.');
    if (!course) throw new ConflictException('Course must be published.');
    if (
      Boolean(dto.learningPathEnrollmentId) !==
      Boolean(dto.learningPathCourseId)
    ) {
      throw new ConflictException(
        'Both learning path context fields are required together.',
      );
    }
    const duplicate = await this.enrollments
      .createQueryBuilder('enrollment')
      .where(
        'enrollment.employeeId = :employeeId AND enrollment.courseId = :courseId',
        dto,
      )
      .andWhere('enrollment.status IN (:...statuses)', {
        statuses: this.activeStatuses,
      })
      .getExists();
    if (duplicate)
      throw new ConflictException({
        code: 'ACTIVE_ENROLLMENT_EXISTS',
        message: 'An active enrollment already exists.',
      });

    const id = await this.dataSource.transaction(async (manager) => {
      const enrollment = await manager.getRepository(EnrollmentEntity).save({
        ...dto,
        learningPathEnrollmentId: dto.learningPathEnrollmentId ?? null,
        learningPathCourseId: dto.learningPathCourseId ?? null,
        reenrollmentOfId: null,
        status: EnrollmentStatus.ENROLLED,
        enrolledAt: new Date(),
        readyAt: null,
        passedAt: null,
        cancelledAt: null,
      });
      const modules = await manager
        .getRepository(CourseModuleEntity)
        .findBy({ courseId: dto.courseId });
      await manager.getRepository(ModuleProgressEntity).save(
        modules.map((module) => ({
          enrollmentId: enrollment.id,
          moduleId: module.id,
          status: ModuleProgressStatus.PENDING,
          completedAt: null,
        })),
      );
      return enrollment.id;
    });
    return this.get(id);
  }

  async list(query: ListEnrollmentsDto, user: AuthenticatedUser) {
    const builder = this.enrollments
      .createQueryBuilder('enrollment')
      .leftJoinAndSelect('enrollment.employee', 'employee')
      .leftJoinAndSelect('enrollment.course', 'course');
    if (user.role === UserRole.EMPLOYEE)
      builder.andWhere('enrollment.employeeId = :ownerId', {
        ownerId: user.employeeId,
      });
    if (query.employeeId)
      builder.andWhere('enrollment.employeeId = :employeeId', query);
    if (query.courseId)
      builder.andWhere('enrollment.courseId = :courseId', query);
    if (query.status) builder.andWhere('enrollment.status = :status', query);
    builder
      .orderBy('enrollment.enrolledAt', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);
    const [data, total] = await builder.getManyAndCount();
    return paginate(data, total, query.page, query.limit);
  }

  async get(id: string, user?: AuthenticatedUser) {
    const enrollment = await this.enrollments.findOne({
      where: { id },
      relations: {
        employee: true,
        course: true,
        moduleProgress: { module: true },
        attempts: true,
        certificate: true,
      },
      order: {
        moduleProgress: { module: { sequenceNumber: 'ASC' } },
        attempts: { attemptNumber: 'ASC' },
      },
    });
    if (!enrollment) throw new NotFoundException('Enrollment not found.');
    this.assertOwner(user, enrollment.employeeId);
    return enrollment;
  }

  async completeModule(
    enrollmentId: string,
    moduleId: string,
    user: AuthenticatedUser,
  ) {
    const enrollment = await this.get(enrollmentId, user);
    if (!this.activeStatuses.includes(enrollment.status))
      throw new ConflictException(
        'Enrollment does not accept progress updates.',
      );
    const progress = (enrollment.moduleProgress ?? []).find(
      (item) => item.moduleId === moduleId,
    );
    if (!progress)
      throw new NotFoundException('Module does not belong to this enrollment.');
    if (progress.status === ModuleProgressStatus.COMPLETED) return enrollment;
    progress.status = ModuleProgressStatus.COMPLETED;
    progress.completedAt = new Date();
    await this.dataSource.getRepository(ModuleProgressEntity).save(progress);
    const requiredIncomplete = (enrollment.moduleProgress ?? []).some(
      (item) =>
        item.module.isRequired &&
        item.id !== progress.id &&
        item.status !== ModuleProgressStatus.COMPLETED,
    );
    enrollment.status = requiredIncomplete
      ? EnrollmentStatus.IN_PROGRESS
      : EnrollmentStatus.READY_FOR_ASSESSMENT;
    if (!requiredIncomplete) enrollment.readyAt = new Date();
    await this.enrollments.save(enrollment);
    return this.get(enrollmentId, user);
  }

  async cancel(id: string) {
    const enrollment = await this.get(id);
    if (!this.activeStatuses.includes(enrollment.status))
      throw new ConflictException(
        'Enrollment cannot be cancelled from its current state.',
      );
    enrollment.status = EnrollmentStatus.CANCELLED;
    enrollment.cancelledAt = new Date();
    return this.enrollments.save(enrollment);
  }

  async reEnroll(id: string) {
    const previous = await this.get(id);
    if (previous.status !== EnrollmentStatus.REENROLLMENT_REQUIRED)
      throw new ConflictException({
        code: 'REENROLLMENT_NOT_ALLOWED',
        message:
          'Re-enrollment is only allowed after the third failed attempt.',
      });
    if (await this.enrollments.existsBy({ reenrollmentOfId: id }))
      throw new ConflictException(
        'This failed enrollment already has a re-enrollment.',
      );
    const created = await this.create({
      employeeId: previous.employeeId,
      courseId: previous.courseId,
      ...(previous.learningPathEnrollmentId && {
        learningPathEnrollmentId: previous.learningPathEnrollmentId,
        learningPathCourseId: previous.learningPathCourseId ?? undefined,
      }),
    });
    await this.enrollments.update(created.id, { reenrollmentOfId: id });
    return this.get(created.id);
  }

  private assertOwner(user: AuthenticatedUser | undefined, employeeId: string) {
    if (user?.role === UserRole.EMPLOYEE && user.employeeId !== employeeId)
      throw new ForbiddenException(
        'Employees may only access their own enrollments.',
      );
  }
}
