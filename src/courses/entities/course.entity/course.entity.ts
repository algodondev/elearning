import { AssessmentEntity } from '../../../assessments/entities/assessment.entity/assessment.entity';
import { CertificateEntity } from '../../../certificates/entities/certificate.entity/certificate.entity';
import { AppBaseEntity } from '../../../common/entities/base.entity/base.entity';
import { EnrollmentEntity } from '../../../enrollments/entities/enrollment.entity/enrollment.entity';
import { LearningPathCourseEntity } from '../../../learning-paths/entities/learning-path-course.entity/learning-path-course.entity';
import { Check, Column, Entity, Index, OneToMany } from 'typeorm';
import { CourseModuleEntity } from '../course-module.entity/course-module.entity';

export enum CourseStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

@Entity({ name: 'courses' })
@Check('CHK_courses_duration_positive', 'estimated_duration_minutes > 0')
@Check('CHK_courses_validity_positive', 'certificate_validity_days > 0')
export class CourseEntity extends AppBaseEntity {
  @Index({ unique: true })
  @Column({ length: 50 })
  code!: string;

  @Column({ length: 200 })
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ name: 'estimated_duration_minutes', type: 'integer' })
  estimatedDurationMinutes!: number;

  @Column({ name: 'is_mandatory', default: false })
  isMandatory!: boolean;

  @Column({ name: 'certificate_validity_days', type: 'integer' })
  certificateValidityDays!: number;

  @Column({ type: 'enum', enum: CourseStatus, default: CourseStatus.DRAFT })
  status!: CourseStatus;

  @OneToMany(() => CourseModuleEntity, (module) => module.course)
  modules?: CourseModuleEntity[];

  @OneToMany(() => AssessmentEntity, (assessment) => assessment.course)
  assessments?: AssessmentEntity[];

  @OneToMany(() => EnrollmentEntity, (enrollment) => enrollment.course)
  enrollments?: EnrollmentEntity[];

  @OneToMany(() => CertificateEntity, (certificate) => certificate.course)
  certificates?: CertificateEntity[];

  @OneToMany(() => LearningPathCourseEntity, (item) => item.course)
  learningPathCourses?: LearningPathCourseEntity[];
}
