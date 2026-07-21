import { AppBaseEntity } from '../../../common/entities/base.entity/base.entity';
import { EmployeeEntity } from '../../../employees/entities/employee.entity/employee.entity';
import { EnrollmentEntity } from '../../../enrollments/entities/enrollment.entity/enrollment.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Unique,
} from 'typeorm';
import { LearningPathEntity } from '../learning-path.entity/learning-path.entity';

export enum LearningPathEnrollmentStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity({ name: 'learning_path_enrollments' })
@Unique('UQ_learning_path_employee', ['learningPathId', 'employeeId'])
export class LearningPathEnrollmentEntity extends AppBaseEntity {
  @Index()
  @Column({ name: 'learning_path_id', type: 'uuid' })
  learningPathId!: string;

  @ManyToOne(() => LearningPathEntity, (path) => path.enrollments, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'learning_path_id' })
  learningPath!: LearningPathEntity;

  @Index()
  @Column({ name: 'employee_id', type: 'uuid' })
  employeeId!: string;

  @ManyToOne(
    () => EmployeeEntity,
    (employee) => employee.learningPathEnrollments,
    {
      onDelete: 'RESTRICT',
    },
  )
  @JoinColumn({ name: 'employee_id' })
  employee!: EmployeeEntity;

  @Column({ type: 'enum', enum: LearningPathEnrollmentStatus })
  status!: LearningPathEnrollmentStatus;

  @Column({ name: 'enrolled_at', type: 'timestamptz' })
  enrolledAt!: Date;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt!: Date | null;

  @Column({ name: 'cancelled_at', type: 'timestamptz', nullable: true })
  cancelledAt!: Date | null;

  @OneToMany(
    () => EnrollmentEntity,
    (enrollment) => enrollment.learningPathEnrollment,
  )
  enrollments?: EnrollmentEntity[];
}
