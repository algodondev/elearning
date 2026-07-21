import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { paginate } from '../../common/dto/pagination.dto/pagination.dto';
import { EmployeeEntity } from '../../employees/entities/employee.entity/employee.entity';
import {
  CreateJobLevelDto,
  ListJobLevelsDto,
  UpdateJobLevelDto,
} from '../dto/organization.dto/organization.dto';
import { JobLevelEntity } from '../entities/job-level.entity/job-level.entity';

@Injectable()
export class JobLevelsService {
  constructor(
    @InjectRepository(JobLevelEntity)
    private readonly levels: Repository<JobLevelEntity>,
    @InjectRepository(EmployeeEntity)
    private readonly employees: Repository<EmployeeEntity>,
  ) {}

  async create(dto: CreateJobLevelDto) {
    await this.assertUnique(dto.name, dto.rankOrder);
    return this.levels.save(
      this.levels.create({
        ...dto,
        description: dto.description ?? null,
        isActive: true,
      }),
    );
  }

  async list(query: ListJobLevelsDto) {
    const builder = this.levels.createQueryBuilder('level');
    if (query.search) {
      builder.andWhere('LOWER(level.name) LIKE :search', {
        search: `%${query.search.toLowerCase()}%`,
      });
    }
    if (query.isActive !== undefined) {
      builder.andWhere('level.isActive = :isActive', {
        isActive: query.isActive,
      });
    }
    builder
      .orderBy('level.rankOrder', 'ASC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);
    const [data, total] = await builder.getManyAndCount();
    return paginate(data, total, query.page, query.limit);
  }

  async get(id: string) {
    const level = await this.levels.findOneBy({ id });
    if (!level) throw new NotFoundException('Job level not found.');
    return level;
  }

  async update(id: string, dto: UpdateJobLevelDto) {
    const level = await this.get(id);
    if (
      (dto.name && dto.name.toLowerCase() !== level.name.toLowerCase()) ||
      (dto.rankOrder && dto.rankOrder !== level.rankOrder)
    ) {
      await this.assertUnique(
        dto.name ?? level.name,
        dto.rankOrder ?? level.rankOrder,
        id,
      );
    }
    Object.assign(level, dto);
    return this.levels.save(level);
  }

  async archive(id: string) {
    const level = await this.get(id);
    if (await this.employees.countBy({ jobLevelId: id, isActive: true })) {
      throw new ConflictException({
        code: 'JOB_LEVEL_HAS_ACTIVE_EMPLOYEES',
        message: 'A job level with active employees cannot be archived.',
      });
    }
    level.isActive = false;
    await this.levels.save(level);
  }

  private async assertUnique(
    name: string,
    rankOrder: number,
    excludeId?: string,
  ) {
    const builder = this.levels
      .createQueryBuilder('level')
      .where(
        '(LOWER(level.name) = LOWER(:name) OR level.rankOrder = :rankOrder)',
        {
          name,
          rankOrder,
        },
      );
    if (excludeId) builder.andWhere('level.id != :excludeId', { excludeId });
    if (await builder.getExists()) {
      throw new ConflictException({
        code: 'JOB_LEVEL_EXISTS',
        message: 'A job level with that name or rank already exists.',
      });
    }
  }
}
