import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  paginate,
  PaginationQueryDto,
} from '../common/dto/pagination.dto/pagination.dto';
import {
  CourseEntity,
  CourseStatus,
} from '../courses/entities/course.entity/course.entity';
import {
  AddLearningPathCourseDto,
  CreateLearningPathDto,
  ReorderLearningPathCourseDto,
  UpdateLearningPathDto,
} from './dto/learning-path.dto/learning-path.dto';
import { LearningPathCourseEntity } from './entities/learning-path-course.entity/learning-path-course.entity';
import { LearningPathEnrollmentEntity } from './entities/learning-path-enrollment.entity/learning-path-enrollment.entity';
import {
  LearningPathEntity,
  LearningPathStatus,
} from './entities/learning-path.entity/learning-path.entity';

@Injectable()
export class LearningPathsService {
  constructor(
    @InjectRepository(LearningPathEntity)
    private readonly paths: Repository<LearningPathEntity>,
    @InjectRepository(LearningPathCourseEntity)
    private readonly items: Repository<LearningPathCourseEntity>,
    @InjectRepository(LearningPathEnrollmentEntity)
    private readonly assignments: Repository<LearningPathEnrollmentEntity>,
    @InjectRepository(CourseEntity)
    private readonly courses: Repository<CourseEntity>,
  ) {}

  async create(dto: CreateLearningPathDto) {
    if (await this.paths.existsBy({ name: dto.name }))
      throw new ConflictException('Learning path name already exists.');
    return this.paths.save(
      this.paths.create({
        name: dto.name,
        description: dto.description ?? null,
        status: LearningPathStatus.DRAFT,
      }),
    );
  }

  async list(query: PaginationQueryDto) {
    const [data, total] = await this.paths.findAndCount({
      order: { name: 'ASC' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });
    return paginate(data, total, query.page, query.limit);
  }

  async get(id: string) {
    const path = await this.paths.findOne({
      where: { id },
      relations: { courses: { course: true } },
      order: { courses: { sequenceNumber: 'ASC' } },
    });
    if (!path) throw new NotFoundException('Learning path not found.');
    return path;
  }

  async update(id: string, dto: UpdateLearningPathDto) {
    const path = await this.get(id);
    Object.assign(path, dto);
    return this.paths.save(path);
  }

  async addCourse(pathId: string, dto: AddLearningPathCourseDto) {
    await this.assertEditable(pathId);
    if (
      !(await this.courses.existsBy({
        id: dto.courseId,
        status: CourseStatus.PUBLISHED,
      }))
    )
      throw new ConflictException(
        'Learning paths only accept published courses.',
      );
    return this.items.save(
      this.items.create({ learningPathId: pathId, ...dto }),
    );
  }

  async reorder(
    pathId: string,
    courseId: string,
    dto: ReorderLearningPathCourseDto,
  ) {
    await this.assertEditable(pathId);
    const item = await this.items.findOneBy({
      learningPathId: pathId,
      courseId,
    });
    if (!item)
      throw new NotFoundException('Course is not in the learning path.');
    item.sequenceNumber = dto.sequenceNumber;
    return this.items.save(item);
  }

  async removeCourse(pathId: string, courseId: string) {
    await this.assertEditable(pathId);
    const item = await this.items.findOneBy({
      learningPathId: pathId,
      courseId,
    });
    if (!item)
      throw new NotFoundException('Course is not in the learning path.');
    await this.items.remove(item);
  }

  async publish(id: string) {
    const path = await this.assertEditable(id);
    if (!(await this.items.countBy({ learningPathId: id })))
      throw new ConflictException({
        code: 'LEARNING_PATH_EMPTY',
        message: 'A learning path must contain at least one course.',
      });
    path.status = LearningPathStatus.PUBLISHED;
    return this.paths.save(path);
  }

  async archive(id: string) {
    const path = await this.get(id);
    if (await this.assignments.existsBy({ learningPathId: id }))
      throw new ConflictException(
        'A learning path with assignments cannot be archived.',
      );
    path.status = LearningPathStatus.ARCHIVED;
    await this.paths.save(path);
  }

  private async assertEditable(id: string) {
    const path = await this.paths.findOneBy({ id });
    if (!path) throw new NotFoundException('Learning path not found.');
    if (await this.assignments.existsBy({ learningPathId: id }))
      throw new ConflictException({
        code: 'LEARNING_PATH_STRUCTURE_LOCKED',
        message: 'A used learning path cannot be changed.',
      });
    if (path.status === LearningPathStatus.ARCHIVED)
      throw new ConflictException('Learning path is archived.');
    return path;
  }
}
