import { Module } from '@nestjs/common';
import { CoursesController } from './courses.controller';
import { ContentsService } from './contents/contents.service';
import { ContentsController } from './contents/contents.controller';
import { ModulesService } from './modules/modules.service';
import { ModulesController } from './modules/modules.controller';
import { CoursesService } from './courses.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourseEntity } from './entities/course.entity/course.entity';
import { CourseModuleEntity } from './entities/course-module.entity/course-module.entity';
import { ModuleContentEntity } from './entities/module-content.entity/module-content.entity';
import { AssessmentEntity } from '../assessments/entities/assessment.entity/assessment.entity';
import { EnrollmentEntity } from '../enrollments/entities/enrollment.entity/enrollment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CourseEntity,
      CourseModuleEntity,
      ModuleContentEntity,
      AssessmentEntity,
      EnrollmentEntity,
    ]),
  ],
  controllers: [CoursesController, ModulesController, ContentsController],
  providers: [CoursesService, ModulesService, ContentsService],
  exports: [CoursesService, ModulesService, TypeOrmModule],
})
export class CoursesModule {}
