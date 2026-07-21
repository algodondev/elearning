import { UserEntity } from '../../../auth/entities/user.entity/user.entity';
import { CertificateEntity } from '../../../certificates/entities/certificate.entity/certificate.entity';
import { AppBaseEntity } from '../../../common/entities/base.entity/base.entity';
import { EnrollmentEntity } from '../../../enrollments/entities/enrollment.entity/enrollment.entity';
import { LearningPathEnrollmentEntity } from '../../../learning-paths/entities/learning-path-enrollment.entity/learning-path-enrollment.entity';
import { AreaEntity } from '../../../organization/entities/area.entity/area.entity';
import { JobLevelEntity } from '../../../organization/entities/job-level.entity/job-level.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';

@Entity({ name: 'employees' })
@Index('IDX_employees_area_active', ['areaId', 'isActive'])
export class EmployeeEntity extends AppBaseEntity {
  @Index({ unique: true })
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @OneToOne(() => UserEntity, (user) => user.employee, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @Index({ unique: true })
  @Column({ name: 'employee_code', length: 50 })
  employeeCode!: string;

  @Column({ name: 'first_name', length: 120 })
  firstName!: string;

  @Column({ name: 'last_name', length: 120 })
  lastName!: string;

  @Index()
  @Column({ name: 'area_id', type: 'uuid' })
  areaId!: string;

  @ManyToOne(() => AreaEntity, (area) => area.employees, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'area_id' })
  area!: AreaEntity;

  @Index()
  @Column({ name: 'job_level_id', type: 'uuid' })
  jobLevelId!: string;

  @ManyToOne(() => JobLevelEntity, (level) => level.employees, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'job_level_id' })
  jobLevel!: JobLevelEntity;

  @Column({ name: 'hire_date', type: 'date' })
  hireDate!: string;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @OneToMany(() => EnrollmentEntity, (enrollment) => enrollment.employee)
  enrollments?: EnrollmentEntity[];

  @OneToMany(() => CertificateEntity, (certificate) => certificate.employee)
  certificates?: CertificateEntity[];

  @OneToMany(
    () => LearningPathEnrollmentEntity,
    (pathEnrollment) => pathEnrollment.employee,
  )
  learningPathEnrollments?: LearningPathEnrollmentEntity[];
}
