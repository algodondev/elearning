import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AssessmentEntity,
  AssessmentStatus,
} from '../assessments/entities/assessment.entity/assessment.entity';
import { paginate } from '../common/dto/pagination.dto/pagination.dto';
import {
  EnrollmentEntity,
  EnrollmentStatus,
} from '../enrollments/entities/enrollment.entity/enrollment.entity';
import {
  CreateCourseDto,
  ListCoursesDto,
  UpdateCourseDto,
} from './dto/course.dto/course.dto';
import { CourseModuleEntity } from './entities/course-module.entity/course-module.entity';
import {
  CourseEntity,
  CourseStatus,
} from './entities/course.entity/course.entity';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(CourseEntity)
    private readonly courses: Repository<CourseEntity>,
    @InjectRepository(CourseModuleEntity)
    private readonly modules: Repository<CourseModuleEntity>,
    @InjectRepository(AssessmentEntity)
    private readonly assessments: Repository<AssessmentEntity>,
    @InjectRepository(EnrollmentEntity)
    private readonly enrollments: Repository<EnrollmentEntity>,
  ) {}

  async create(dto: CreateCourseDto) {
    if (await this.courses.existsBy({ code: dto.code })) {
      throw new ConflictException({
        code: 'COURSE_CODE_EXISTS',
        message: 'Course code already exists.',
      });
    }
    return this.courses.save(
      this.courses.create({ ...dto, status: CourseStatus.DRAFT }),
    );
  }

  async list(query: ListCoursesDto, employeeView = false) {
    const builder = this.courses.createQueryBuilder('course');
    if (employeeView)
      builder.andWhere('course.status = :published', {
        published: CourseStatus.PUBLISHED,
      });
    else if (query.status)
      builder.andWhere('course.status = :status', { status: query.status });
    if (query.isMandatory !== undefined)
      builder.andWhere('course.isMandatory = :isMandatory', query);
    if (query.search)
      builder.andWhere(
        '(LOWER(course.title) LIKE :search OR LOWER(course.code) LIKE :search)',
        {
          search: `%${query.search.toLowerCase()}%`,
        },
      );
    builder
      .orderBy('course.code', 'ASC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);
    const [data, total] = await builder.getManyAndCount();
    return paginate(data, total, query.page, query.limit);
  }

  async get(id: string) {
    const course = await this.courses.findOne({
      where: { id },
      relations: { modules: { contents: true }, assessments: true },
      order: {
        modules: { sequenceNumber: 'ASC', contents: { sequenceNumber: 'ASC' } },
      },
    });
    if (!course) throw new NotFoundException('Course not found.');
    return course;
  }

  async update(id: string, dto: UpdateCourseDto) {
    const course = await this.get(id);
    if (
      dto.code &&
      dto.code !== course.code &&
      (await this.courses.existsBy({ code: dto.code }))
    ) {
      throw new ConflictException('Course code already exists.');
    }
    Object.assign(course, dto);
    return this.courses.save(course);
  }

  async publish(id: string) {
    const course = await this.get(id);
    const [requiredModules, publishedAssessment] = await Promise.all([
      this.modules.countBy({ courseId: id, isRequired: true }),
      this.assessments.countBy({
        courseId: id,
        status: AssessmentStatus.PUBLISHED,
      }),
    ]);
    if (!requiredModules || !publishedAssessment) {
      throw new ConflictException({
        code: 'COURSE_NOT_PUBLISHABLE',
        message: 'A course needs a required module and published assessment.',
      });
    }
    course.status = CourseStatus.PUBLISHED;
    return this.courses.save(course);
  }

  async archive(id: string): Promise<void> {
    const course = await this.get(id);
    const active = await this.enrollments
      .createQueryBuilder('enrollment')
      .where('enrollment.courseId = :id', { id })
      .andWhere('enrollment.status IN (:...statuses)', {
        statuses: [
          EnrollmentStatus.ENROLLED,
          EnrollmentStatus.IN_PROGRESS,
          EnrollmentStatus.READY_FOR_ASSESSMENT,
        ],
      })
      .getExists();
    if (active)
      throw new ConflictException(
        'A course with active enrollments cannot be archived.',
      );
    course.status = CourseStatus.ARCHIVED;
    await this.courses.save(course);
  }

  async assertStructureEditable(courseId: string) {
    const course = await this.courses.findOneBy({ id: courseId });
    if (!course) throw new NotFoundException('Course not found.');
    if (await this.enrollments.existsBy({ courseId })) {
      throw new ConflictException({
        code: 'COURSE_STRUCTURE_LOCKED',
        message: 'Course structure cannot change after its first enrollment.',
      });
    }
    if (course.status === CourseStatus.ARCHIVED)
      throw new ConflictException('Course is archived.');
    return course;
  }
}
