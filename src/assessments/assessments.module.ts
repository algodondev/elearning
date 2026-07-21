import { Module } from '@nestjs/common';
import { AssessmentsController } from './assessments.controller';
import { AttemptsService } from './attempts/attempts.service';
import { ScoringService } from './scoring/scoring.service';
import { AssessmentsService } from './assessments.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssessmentEntity } from './entities/assessment.entity/assessment.entity';
import { QuestionEntity } from './entities/question.entity/question.entity';
import { QuestionOptionEntity } from './entities/question-option.entity/question-option.entity';
import { AssessmentAttemptEntity } from './entities/assessment-attempt.entity/assessment-attempt.entity';
import { AttemptAnswerEntity } from './entities/attempt-answer.entity/attempt-answer.entity';
import { AttemptAnswerOptionEntity } from './entities/attempt-answer-option.entity/attempt-answer-option.entity';
import { CourseEntity } from '../courses/entities/course.entity/course.entity';
import { EnrollmentEntity } from '../enrollments/entities/enrollment.entity/enrollment.entity';
import { CertificateEntity } from '../certificates/entities/certificate.entity/certificate.entity';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    CommonModule,
    TypeOrmModule.forFeature([
      AssessmentEntity,
      QuestionEntity,
      QuestionOptionEntity,
      AssessmentAttemptEntity,
      AttemptAnswerEntity,
      AttemptAnswerOptionEntity,
      CourseEntity,
      EnrollmentEntity,
      CertificateEntity,
    ]),
  ],
  controllers: [AssessmentsController],
  providers: [AssessmentsService, ScoringService, AttemptsService],
  exports: [AssessmentsService, ScoringService, AttemptsService, TypeOrmModule],
})
export class AssessmentsModule {}
