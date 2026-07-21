import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EmployeeEntity } from '../../employees/entities/employee.entity/employee.entity';
import { Repository } from 'typeorm';
import { paginate } from '../../common/dto/pagination.dto/pagination.dto';
import {
  CreateAreaDto,
  ListAreasDto,
  UpdateAreaDto,
} from '../dto/organization.dto/organization.dto';
import { AreaEntity } from '../entities/area.entity/area.entity';

@Injectable()
export class AreasService {
  constructor(
    @InjectRepository(AreaEntity)
    private readonly areas: Repository<AreaEntity>,
    @InjectRepository(EmployeeEntity)
    private readonly employees: Repository<EmployeeEntity>,
  ) {}

  async create(dto: CreateAreaDto) {
    await this.assertUniqueName(dto.name);
    return this.areas.save(
      this.areas.create({
        name: dto.name,
        description: dto.description ?? null,
        isActive: true,
      }),
    );
  }

  async list(query: ListAreasDto) {
    const builder = this.areas.createQueryBuilder('area');
    if (query.search) {
      builder.andWhere('LOWER(area.name) LIKE :search', {
        search: `%${query.search.toLowerCase()}%`,
      });
    }
    if (query.isActive !== undefined) {
      builder.andWhere('area.isActive = :isActive', {
        isActive: query.isActive,
      });
    }
    builder
      .orderBy('area.name', 'ASC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);
    const [data, total] = await builder.getManyAndCount();
    return paginate(data, total, query.page, query.limit);
  }

  async get(id: string) {
    const area = await this.areas.findOneBy({ id });
    if (!area) throw new NotFoundException('Area not found.');
    return area;
  }

  async update(id: string, dto: UpdateAreaDto) {
    const area = await this.get(id);
    if (dto.name && dto.name.toLowerCase() !== area.name.toLowerCase()) {
      await this.assertUniqueName(dto.name, id);
      area.name = dto.name;
    }
    if (dto.description !== undefined) area.description = dto.description;
    if (dto.isActive !== undefined) area.isActive = dto.isActive;
    return this.areas.save(area);
  }

  async archive(id: string): Promise<void> {
    const area = await this.get(id);
    const activeEmployees = await this.employees.countBy({
      areaId: id,
      isActive: true,
    });
    if (activeEmployees > 0) {
      throw new ConflictException({
        code: 'AREA_HAS_ACTIVE_EMPLOYEES',
        message: 'An area with active employees cannot be archived.',
      });
    }
    area.isActive = false;
    await this.areas.save(area);
  }

  private async assertUniqueName(name: string, excludeId?: string) {
    const builder = this.areas
      .createQueryBuilder('area')
      .where('LOWER(area.name) = LOWER(:name)', { name });
    if (excludeId) builder.andWhere('area.id != :excludeId', { excludeId });
    if (await builder.getExists()) {
      throw new ConflictException({
        code: 'AREA_NAME_EXISTS',
        message: 'An area with that name already exists.',
      });
    }
  }
}
