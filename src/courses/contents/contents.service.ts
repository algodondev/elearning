import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateModuleContentDto,
  UpdateModuleContentDto,
} from '../dto/course.dto/course.dto';
import { CourseModuleEntity } from '../entities/course-module.entity/course-module.entity';
import {
  ContentType,
  ModuleContentEntity,
} from '../entities/module-content.entity/module-content.entity';
import { CoursesService } from '../courses.service';

@Injectable()
export class ContentsService {
  constructor(
    @InjectRepository(ModuleContentEntity)
    private readonly contents: Repository<ModuleContentEntity>,
    @InjectRepository(CourseModuleEntity)
    private readonly modules: Repository<CourseModuleEntity>,
    private readonly courses: CoursesService,
  ) {}

  async create(moduleId: string, dto: CreateModuleContentDto) {
    const module = await this.modules.findOneBy({ id: moduleId });
    if (!module) throw new NotFoundException('Course module not found.');
    await this.courses.assertStructureEditable(module.courseId);
    this.assertPayload(dto);
    return this.contents.save(
      this.contents.create({
        ...dto,
        moduleId,
        contentUrl: dto.contentUrl ?? null,
        body: dto.body ?? null,
      }),
    );
  }

  list(moduleId: string) {
    return this.contents.find({
      where: { moduleId },
      order: { sequenceNumber: 'ASC' },
    });
  }

  async update(moduleId: string, id: string, dto: UpdateModuleContentDto) {
    const content = await this.contents.findOne({
      where: { id, moduleId },
      relations: { module: true },
    });
    if (!content) throw new NotFoundException('Module content not found.');
    await this.courses.assertStructureEditable(content.module.courseId);
    const merged = { ...content, ...dto };
    this.assertPayload(merged);
    Object.assign(content, dto);
    return this.contents.save(content);
  }

  async remove(moduleId: string, id: string): Promise<void> {
    const content = await this.contents.findOne({
      where: { id, moduleId },
      relations: { module: true },
    });
    if (!content) throw new NotFoundException('Module content not found.');
    await this.courses.assertStructureEditable(content.module.courseId);
    await this.contents.remove(content);
  }

  private assertPayload(dto: {
    contentType: ContentType;
    contentUrl?: string | null;
    body?: string | null;
  }) {
    const valid =
      dto.contentType === ContentType.TEXT
        ? Boolean(dto.body && !dto.contentUrl)
        : Boolean(dto.contentUrl && !dto.body);
    if (!valid) {
      throw new BadRequestException({
        code: 'INVALID_CONTENT_PAYLOAD',
        message: 'TEXT requires body; other content types require contentUrl.',
      });
    }
  }
}
