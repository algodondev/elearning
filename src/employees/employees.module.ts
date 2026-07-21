import { Module } from '@nestjs/common';
import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeeEntity } from './entities/employee.entity/employee.entity';
import { AreaEntity } from '../organization/entities/area.entity/area.entity';
import { JobLevelEntity } from '../organization/entities/job-level.entity/job-level.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmployeeEntity, AreaEntity, JobLevelEntity]),
  ],
  controllers: [EmployeesController],
  providers: [EmployeesService],
  exports: [EmployeesService, TypeOrmModule],
})
export class EmployeesModule {}
