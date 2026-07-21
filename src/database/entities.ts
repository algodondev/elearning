import { AssessmentAttemptEntity } from '../assessments/entities/assessment-attempt.entity/assessment-attempt.entity';
import { AssessmentEntity } from '../assessments/entities/assessment.entity/assessment.entity';
import { AttemptAnswerOptionEntity } from '../assessments/entities/attempt-answer-option.entity/attempt-answer-option.entity';
import { AttemptAnswerEntity } from '../assessments/entities/attempt-answer.entity/attempt-answer.entity';
import { QuestionOptionEntity } from '../assessments/entities/question-option.entity/question-option.entity';
import { QuestionEntity } from '../assessments/entities/question.entity/question.entity';
import { UserEntity } from '../auth/entities/user.entity/user.entity';
import { CertificateAlertEntity } from '../certificates/entities/certificate-alert.entity/certificate-alert.entity';
import { CertificateEntity } from '../certificates/entities/certificate.entity/certificate.entity';
import { CourseModuleEntity } from '../courses/entities/course-module.entity/course-module.entity';
import { CourseEntity } from '../courses/entities/course.entity/course.entity';
import { ModuleContentEntity } from '../courses/entities/module-content.entity/module-content.entity';
import { EmployeeEntity } from '../employees/entities/employee.entity/employee.entity';
import { EnrollmentEntity } from '../enrollments/entities/enrollment.entity/enrollment.entity';
import { ModuleProgressEntity } from '../enrollments/entities/module-progress.entity/module-progress.entity';
import { LearningPathCourseEntity } from '../learning-paths/entities/learning-path-course.entity/learning-path-course.entity';
import { LearningPathEnrollmentEntity } from '../learning-paths/entities/learning-path-enrollment.entity/learning-path-enrollment.entity';
import { LearningPathEntity } from '../learning-paths/entities/learning-path.entity/learning-path.entity';
import { AreaEntity } from '../organization/entities/area.entity/area.entity';
import { JobLevelEntity } from '../organization/entities/job-level.entity/job-level.entity';

export const databaseEntities = [
  UserEntity,
  AreaEntity,
  JobLevelEntity,
  EmployeeEntity,
  CourseEntity,
  CourseModuleEntity,
  ModuleContentEntity,
  AssessmentEntity,
  QuestionEntity,
  QuestionOptionEntity,
  EnrollmentEntity,
  ModuleProgressEntity,
  AssessmentAttemptEntity,
  AttemptAnswerEntity,
  AttemptAnswerOptionEntity,
  CertificateEntity,
  CertificateAlertEntity,
  LearningPathEntity,
  LearningPathCourseEntity,
  LearningPathEnrollmentEntity,
];
