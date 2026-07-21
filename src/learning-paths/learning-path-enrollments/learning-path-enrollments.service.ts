import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { UserRole } from '../../auth/entities/user.entity/user.entity';
import type { AuthenticatedUser } from '../../auth/strategies/jwt.strategy/jwt.strategy';
import { paginate } from '../../common/dto/pagination.dto/pagination.dto';
import { EmployeeEntity } from '../../employees/entities/employee.entity/employee.entity';
import { EnrollmentsService } from '../../enrollments/enrollments.service';
import {
  EnrollmentEntity,
  EnrollmentStatus,
} from '../../enrollments/entities/enrollment.entity/enrollment.entity';
import {
  AssignLearningPathDto,
  ListLearningPathEnrollmentsDto,
} from '../dto/learning-path.dto/learning-path.dto';
import { LearningPathCourseEntity } from '../entities/learning-path-course.entity/learning-path-course.entity';
import {
  LearningPathEnrollmentEntity,
  LearningPathEnrollmentStatus,
} from '../entities/learning-path-enrollment.entity/learning-path-enrollment.entity';
import {
  LearningPathEntity,
  LearningPathStatus,
} from '../entities/learning-path.entity/learning-path.entity';
import { UnlockPolicyService } from '../unlock-policy/unlock-policy.service';

export enum LearningPathCourseProgressStatus {
  LOCKED = 'LOCKED',
  UNLOCKED = 'UNLOCKED',
  IN_PROGRESS = 'IN_PROGRESS',
  PASSED = 'PASSED',
}

@Injectable()
export class LearningPathEnrollmentsService {
  private readonly activeEnrollmentStatuses = [
    EnrollmentStatus.ENROLLED,
    EnrollmentStatus.IN_PROGRESS,
    EnrollmentStatus.READY_FOR_ASSESSMENT,
  ];

  constructor(
    @InjectRepository(LearningPathEnrollmentEntity)
    private readonly assignments: Repository<LearningPathEnrollmentEntity>,
    @InjectRepository(LearningPathEntity)
    private readonly paths: Repository<LearningPathEntity>,
    @InjectRepository(LearningPathCourseEntity)
    private readonly pathCourses: Repository<LearningPathCourseEntity>,
    @InjectRepository(EmployeeEntity)
    private readonly employees: Repository<EmployeeEntity>,
    @InjectRepository(EnrollmentEntity)
    private readonly enrollments: Repository<EnrollmentEntity>,
    private readonly enrollmentService: EnrollmentsService,
    private readonly unlockPolicy: UnlockPolicyService,
  ) {}

  async assign(dto: AssignLearningPathDto) {
    const [path, employee] = await Promise.all([
      this.paths.findOneBy({
        id: dto.learningPathId,
        status: LearningPathStatus.PUBLISHED,
      }),
      this.employees.findOneBy({ id: dto.employeeId, isActive: true }),
    ]);
    if (!path) throw new ConflictException('Learning path must be published.');
    if (!employee) throw new ConflictException('Employee must be active.');
    if (await this.assignments.existsBy(dto))
      throw new ConflictException({
        code: 'LEARNING_PATH_ALREADY_ASSIGNED',
        message: 'The employee already has this learning path assignment.',
      });
    return this.assignments.save(
      this.assignments.create({
        ...dto,
        status: LearningPathEnrollmentStatus.ACTIVE,
        enrolledAt: new Date(),
        completedAt: null,
        cancelledAt: null,
      }),
    );
  }

  async list(query: ListLearningPathEnrollmentsDto, user: AuthenticatedUser) {
    const builder = this.assignments
      .createQueryBuilder('assignment')
      .leftJoinAndSelect('assignment.learningPath', 'learningPath')
      .leftJoinAndSelect('assignment.employee', 'employee');
    if (user.role === UserRole.EMPLOYEE) {
      builder.andWhere('assignment.employeeId = :ownerId', {
        ownerId: user.employeeId,
      });
    } else if (query.employeeId) {
      builder.andWhere('assignment.employeeId = :employeeId', query);
    }
    if (query.learningPathId)
      builder.andWhere('assignment.learningPathId = :learningPathId', query);
    builder
      .orderBy('assignment.enrolledAt', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);
    const [data, total] = await builder.getManyAndCount();
    return paginate(data, total, query.page, query.limit);
  }

  async get(id: string, user?: AuthenticatedUser) {
    const assignment = await this.assignments.findOne({
      where: { id },
      relations: {
        learningPath: { courses: { course: true } },
        employee: true,
      },
      order: {
        learningPath: { courses: { sequenceNumber: 'ASC' } },
      },
    });
    if (!assignment)
      throw new NotFoundException('Learning path assignment not found.');
    this.assertOwner(user, assignment.employeeId);

    const orderedItems = [...(assignment.learningPath.courses ?? [])].sort(
      (left, right) => left.sequenceNumber - right.sequenceNumber,
    );
    const histories = orderedItems.length
      ? await this.enrollments.findBy({
          employeeId: assignment.employeeId,
          courseId: In(orderedItems.map((item) => item.courseId)),
        })
      : [];
    const passedCourseIds = new Set(
      histories
        .filter((entry) => entry.status === EnrollmentStatus.PASSED)
        .map((entry) => entry.courseId),
    );
    const activeCourseIds = new Set(
      histories
        .filter((entry) => this.activeEnrollmentStatuses.includes(entry.status))
        .map((entry) => entry.courseId),
    );

    return {
      ...assignment,
      courses: orderedItems.map((item, index) => ({
        ...item,
        progressStatus: passedCourseIds.has(item.courseId)
          ? LearningPathCourseProgressStatus.PASSED
          : activeCourseIds.has(item.courseId)
            ? LearningPathCourseProgressStatus.IN_PROGRESS
            : index === 0 ||
                passedCourseIds.has(orderedItems[index - 1].courseId)
              ? LearningPathCourseProgressStatus.UNLOCKED
              : LearningPathCourseProgressStatus.LOCKED,
      })),
    };
  }

  async enrollCourse(
    assignmentId: string,
    courseId: string,
    user: AuthenticatedUser,
  ) {
    const assignment = await this.assignments.findOneBy({ id: assignmentId });
    if (!assignment)
      throw new NotFoundException('Learning path assignment not found.');
    this.assertOwner(user, assignment.employeeId);
    if (assignment.status !== LearningPathEnrollmentStatus.ACTIVE)
      throw new ConflictException('Learning path assignment is not active.');

    const items = await this.pathCourses.find({
      where: { learningPathId: assignment.learningPathId },
      order: { sequenceNumber: 'ASC' },
    });
    const passed = await this.enrollments.find({
      where: {
        employeeId: assignment.employeeId,
        status: EnrollmentStatus.PASSED,
        courseId: In(items.map((item) => item.courseId)),
      },
    });
    this.unlockPolicy.assertUnlocked(
      items.map((item) => item.courseId),
      courseId,
      new Set(passed.map((item) => item.courseId)),
    );
    const pathCourse = items.find((item) => item.courseId === courseId);
    if (!pathCourse)
      throw new NotFoundException('Course is not in the learning path.');
    return this.enrollmentService.create({
      employeeId: assignment.employeeId,
      courseId,
      learningPathEnrollmentId: assignment.id,
      learningPathCourseId: pathCourse.id,
    });
  }

  private assertOwner(user: AuthenticatedUser | undefined, employeeId: string) {
    if (user?.role === UserRole.EMPLOYEE && user.employeeId !== employeeId)
      throw new ForbiddenException(
        'Employees may only access their own learning path assignments.',
      );
  }
}
