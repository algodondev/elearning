import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourseEntity } from '../courses/entities/course.entity/course.entity';
import { EmployeeEntity } from '../employees/entities/employee.entity/employee.entity';
import { EnrollmentsModule } from '../enrollments/enrollments.module';
import { EnrollmentEntity } from '../enrollments/entities/enrollment.entity/enrollment.entity';
import { LearningPathCourseEntity } from './entities/learning-path-course.entity/learning-path-course.entity';
import { LearningPathEnrollmentEntity } from './entities/learning-path-enrollment.entity/learning-path-enrollment.entity';
import { LearningPathEntity } from './entities/learning-path.entity/learning-path.entity';
import { LearningPathsController } from './learning-paths.controller';
import { UnlockPolicyService } from './unlock-policy/unlock-policy.service';
import { LearningPathEnrollmentsService } from './learning-path-enrollments/learning-path-enrollments.service';
import { LearningPathEnrollmentsController } from './learning-path-enrollments/learning-path-enrollments.controller';
import { LearningPathsService } from './learning-paths.service';

@Module({
  imports: [
    EnrollmentsModule,
    TypeOrmModule.forFeature([
      LearningPathEntity,
      LearningPathCourseEntity,
      LearningPathEnrollmentEntity,
      CourseEntity,
      EmployeeEntity,
      EnrollmentEntity,
    ]),
  ],
  controllers: [LearningPathsController, LearningPathEnrollmentsController],
  providers: [
    LearningPathsService,
    LearningPathEnrollmentsService,
    UnlockPolicyService,
  ],
  exports: [LearningPathsService, LearningPathEnrollmentsService],
})
export class LearningPathsModule {}
