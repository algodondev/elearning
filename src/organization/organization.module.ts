import { Module } from '@nestjs/common';
import { AreasController } from './areas/areas.controller';
import { AreasService } from './areas/areas.service';
import { JobLevelsController } from './job-levels/job-levels.controller';
import { JobLevelsService } from './job-levels/job-levels.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AreaEntity } from './entities/area.entity/area.entity';
import { JobLevelEntity } from './entities/job-level.entity/job-level.entity';
import { EmployeeEntity } from '../employees/entities/employee.entity/employee.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AreaEntity, JobLevelEntity, EmployeeEntity]),
  ],
  controllers: [AreasController, JobLevelsController],
  providers: [AreasService, JobLevelsService],
  exports: [AreasService, JobLevelsService, TypeOrmModule],
})
export class OrganizationModule {}
