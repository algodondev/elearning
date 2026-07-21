import { Module } from '@nestjs/common';
import { EnrollmentsController } from './enrollments.controller';
import { EnrollmentsService } from './enrollments.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnrollmentEntity } from './entities/enrollment.entity/enrollment.entity';
import { ModuleProgressEntity } from './entities/module-progress.entity/module-progress.entity';
import { EmployeeEntity } from '../employees/entities/employee.entity/employee.entity';
import { CourseEntity } from '../courses/entities/course.entity/course.entity';
import { CourseModuleEntity } from '../courses/entities/course-module.entity/course-module.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EnrollmentEntity,
      ModuleProgressEntity,
      EmployeeEntity,
      CourseEntity,
      CourseModuleEntity,
    ]),
  ],
  controllers: [EnrollmentsController],
  providers: [EnrollmentsService],
  exports: [EnrollmentsService, TypeOrmModule],
})
export class EnrollmentsModule {}
