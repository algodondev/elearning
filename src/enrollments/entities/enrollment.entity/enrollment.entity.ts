import { AssessmentAttemptEntity } from '../../../assessments/entities/assessment-attempt.entity/assessment-attempt.entity';
import { CertificateEntity } from '../../../certificates/entities/certificate.entity/certificate.entity';
import { AppBaseEntity } from '../../../common/entities/base.entity/base.entity';
import { CourseEntity } from '../../../courses/entities/course.entity/course.entity';
import { EmployeeEntity } from '../../../employees/entities/employee.entity/employee.entity';
import { LearningPathCourseEntity } from '../../../learning-paths/entities/learning-path-course.entity/learning-path-course.entity';
import { LearningPathEnrollmentEntity } from '../../../learning-paths/entities/learning-path-enrollment.entity/learning-path-enrollment.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { ModuleProgressEntity } from '../module-progress.entity/module-progress.entity';

export enum EnrollmentStatus {
  ENROLLED = 'ENROLLED',
  IN_PROGRESS = 'IN_PROGRESS',
  READY_FOR_ASSESSMENT = 'READY_FOR_ASSESSMENT',
  PASSED = 'PASSED',
  REENROLLMENT_REQUIRED = 'REENROLLMENT_REQUIRED',
  CANCELLED = 'CANCELLED',
}

@Entity({ name: 'enrollments' })
@Index('IDX_enrollments_employee_course_status', [
  'employeeId',
  'courseId',
  'status',
])
export class EnrollmentEntity extends AppBaseEntity {
  @Column({ name: 'employee_id', type: 'uuid' })
  employeeId!: string;

  @ManyToOne(() => EmployeeEntity, (employee) => employee.enrollments, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'employee_id' })
  employee!: EmployeeEntity;

  @Column({ name: 'course_id', type: 'uuid' })
  courseId!: string;

  @ManyToOne(() => CourseEntity, (course) => course.enrollments, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'course_id' })
  course!: CourseEntity;

  @Column({ type: 'enum', enum: EnrollmentStatus })
  status!: EnrollmentStatus;

  @Column({
    name: 'learning_path_enrollment_id',
    type: 'uuid',
    nullable: true,
  })
  learningPathEnrollmentId!: string | null;

  @ManyToOne(() => LearningPathEnrollmentEntity, (path) => path.enrollments, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'learning_path_enrollment_id' })
  learningPathEnrollment!: LearningPathEnrollmentEntity | null;

  @Column({ name: 'learning_path_course_id', type: 'uuid', nullable: true })
  learningPathCourseId!: string | null;

  @ManyToOne(() => LearningPathCourseEntity, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'learning_path_course_id' })
  learningPathCourse!: LearningPathCourseEntity | null;

  @Index({ unique: true })
  @Column({ name: 'reenrollment_of_id', type: 'uuid', nullable: true })
  reenrollmentOfId!: string | null;

  @OneToOne(() => EnrollmentEntity, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'reenrollment_of_id' })
  reenrollmentOf!: EnrollmentEntity | null;

  @Column({ name: 'enrolled_at', type: 'timestamptz' })
  enrolledAt!: Date;

  @Column({ name: 'ready_at', type: 'timestamptz', nullable: true })
  readyAt!: Date | null;

  @Column({ name: 'passed_at', type: 'timestamptz', nullable: true })
  passedAt!: Date | null;

  @Column({ name: 'cancelled_at', type: 'timestamptz', nullable: true })
  cancelledAt!: Date | null;

  @OneToMany(() => ModuleProgressEntity, (progress) => progress.enrollment)
  moduleProgress?: ModuleProgressEntity[];

  @OneToMany(() => AssessmentAttemptEntity, (attempt) => attempt.enrollment)
  attempts?: AssessmentAttemptEntity[];

  @OneToOne(() => CertificateEntity, (certificate) => certificate.enrollment)
  certificate?: CertificateEntity;
}
