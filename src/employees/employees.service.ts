import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { hash } from 'bcrypt';
import { DataSource, Repository } from 'typeorm';
import { UserEntity, UserRole } from '../auth/entities/user.entity/user.entity';
import { paginate } from '../common/dto/pagination.dto/pagination.dto';
import { AreaEntity } from '../organization/entities/area.entity/area.entity';
import { JobLevelEntity } from '../organization/entities/job-level.entity/job-level.entity';
import {
  CreateEmployeeDto,
  ListEmployeesDto,
  UpdateEmployeeDto,
} from './dto/employee.dto/employee.dto';
import { EmployeeEntity } from './entities/employee.entity/employee.entity';

@Injectable()
export class EmployeesService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
    @InjectRepository(EmployeeEntity)
    private readonly employees: Repository<EmployeeEntity>,
    @InjectRepository(AreaEntity)
    private readonly areas: Repository<AreaEntity>,
    @InjectRepository(JobLevelEntity)
    private readonly levels: Repository<JobLevelEntity>,
  ) {}

  async create(dto: CreateEmployeeDto) {
    await this.validateReferences(dto.areaId, dto.jobLevelId);
    const employee = await this.dataSource.transaction(async (manager) => {
      if (
        await manager.getRepository(UserEntity).existsBy({ email: dto.email })
      ) {
        throw new ConflictException({
          code: 'USER_EMAIL_EXISTS',
          message: 'A user with that email already exists.',
        });
      }
      if (
        await manager
          .getRepository(EmployeeEntity)
          .existsBy({ employeeCode: dto.employeeCode })
      ) {
        throw new ConflictException({
          code: 'EMPLOYEE_CODE_EXISTS',
          message: 'An employee with that code already exists.',
        });
      }
      const user = await manager.getRepository(UserEntity).save({
        email: dto.email,
        passwordHash: await hash(
          dto.password,
          this.config.get<number>('BCRYPT_ROUNDS', 12),
        ),
        role: UserRole.EMPLOYEE,
        isActive: true,
        lastLoginAt: null,
      });
      return manager.getRepository(EmployeeEntity).save({
        userId: user.id,
        employeeCode: dto.employeeCode,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        areaId: dto.areaId,
        jobLevelId: dto.jobLevelId,
        hireDate: dto.hireDate,
        isActive: true,
      });
    });
    return this.get(employee.id);
  }

  async list(query: ListEmployeesDto) {
    const builder = this.employees
      .createQueryBuilder('employee')
      .leftJoinAndSelect('employee.user', 'user')
      .leftJoinAndSelect('employee.area', 'area')
      .leftJoinAndSelect('employee.jobLevel', 'jobLevel');
    if (query.areaId) builder.andWhere('employee.areaId = :areaId', query);
    if (query.jobLevelId)
      builder.andWhere('employee.jobLevelId = :jobLevelId', query);
    if (query.isActive !== undefined)
      builder.andWhere('employee.isActive = :isActive', query);
    if (query.search) {
      builder.andWhere(
        `(LOWER(employee.firstName) LIKE :search OR LOWER(employee.lastName) LIKE :search OR LOWER(employee.employeeCode) LIKE :search)`,
        { search: `%${query.search.toLowerCase()}%` },
      );
    }
    builder
      .orderBy('employee.lastName', 'ASC')
      .addOrderBy('employee.firstName', 'ASC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);
    const [rows, total] = await builder.getManyAndCount();
    return paginate(
      rows.map((row) => this.toResponse(row)),
      total,
      query.page,
      query.limit,
    );
  }

  async get(id: string) {
    const employee = await this.employees.findOne({
      where: { id },
      relations: { user: true, area: true, jobLevel: true },
    });
    if (!employee) throw new NotFoundException('Employee not found.');
    return this.toResponse(employee);
  }

  async update(id: string, dto: UpdateEmployeeDto) {
    const employee = await this.employees.findOne({
      where: { id },
      relations: { user: true },
    });
    if (!employee) throw new NotFoundException('Employee not found.');
    await this.validateReferences(
      dto.areaId ?? employee.areaId,
      dto.jobLevelId ?? employee.jobLevelId,
    );
    await this.dataSource.transaction(async (manager) => {
      if (dto.email && dto.email !== employee.user.email) {
        if (
          await manager.getRepository(UserEntity).existsBy({ email: dto.email })
        ) {
          throw new ConflictException('A user with that email already exists.');
        }
        employee.user.email = dto.email;
      }
      if (dto.password) {
        employee.user.passwordHash = await hash(
          dto.password,
          this.config.get<number>('BCRYPT_ROUNDS', 12),
        );
      }
      if (dto.isActive !== undefined) {
        employee.isActive = dto.isActive;
        employee.user.isActive = dto.isActive;
      }
      for (const key of [
        'employeeCode',
        'firstName',
        'lastName',
        'areaId',
        'jobLevelId',
        'hireDate',
      ] as const) {
        if (dto[key] !== undefined) employee[key] = dto[key];
      }
      await manager.getRepository(UserEntity).save(employee.user);
      await manager.getRepository(EmployeeEntity).save(employee);
    });
    return this.get(id);
  }

  async deactivate(id: string): Promise<void> {
    await this.update(id, { isActive: false });
  }

  private async validateReferences(areaId: string, jobLevelId: string) {
    const [area, level] = await Promise.all([
      this.areas.findOneBy({ id: areaId, isActive: true }),
      this.levels.findOneBy({ id: jobLevelId, isActive: true }),
    ]);
    if (!area) throw new ConflictException('Area must be active.');
    if (!level) throw new ConflictException('Job level must be active.');
  }

  private toResponse(employee: EmployeeEntity) {
    return {
      id: employee.id,
      employeeCode: employee.employeeCode,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.user.email,
      areaId: employee.areaId,
      area: employee.area,
      jobLevelId: employee.jobLevelId,
      jobLevel: employee.jobLevel,
      hireDate: employee.hireDate,
      isActive: employee.isActive,
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt,
    };
  }
}
