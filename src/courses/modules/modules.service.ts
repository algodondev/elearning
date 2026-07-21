import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateCourseModuleDto,
  UpdateCourseModuleDto,
} from '../dto/course.dto/course.dto';
import { CourseModuleEntity } from '../entities/course-module.entity/course-module.entity';
import { CoursesService } from '../courses.service';

@Injectable()
export class ModulesService {
  constructor(
    @InjectRepository(CourseModuleEntity)
    private readonly modules: Repository<CourseModuleEntity>,
    private readonly courses: CoursesService,
  ) {}

  async create(courseId: string, dto: CreateCourseModuleDto) {
    await this.courses.assertStructureEditable(courseId);
    return this.modules.save(
      this.modules.create({
        ...dto,
        courseId,
        description: dto.description ?? null,
      }),
    );
  }

  list(courseId: string) {
    return this.modules.find({
      where: { courseId },
      order: { sequenceNumber: 'ASC' },
    });
  }

  async get(courseId: string, id: string) {
    const module = await this.modules.findOne({
      where: { id, courseId },
      relations: { contents: true },
      order: { contents: { sequenceNumber: 'ASC' } },
    });
    if (!module) throw new NotFoundException('Course module not found.');
    return module;
  }

  async update(courseId: string, id: string, dto: UpdateCourseModuleDto) {
    await this.courses.assertStructureEditable(courseId);
    const module = await this.get(courseId, id);
    Object.assign(module, dto);
    return this.modules.save(module);
  }

  async remove(courseId: string, id: string): Promise<void> {
    await this.courses.assertStructureEditable(courseId);
    await this.modules.remove(await this.get(courseId, id));
  }
}
