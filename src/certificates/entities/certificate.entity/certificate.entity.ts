import { AppBaseEntity } from '../../../common/entities/base.entity/base.entity';
import { CourseEntity } from '../../../courses/entities/course.entity/course.entity';
import { EmployeeEntity } from '../../../employees/entities/employee.entity/employee.entity';
import { EnrollmentEntity } from '../../../enrollments/entities/enrollment.entity/enrollment.entity';
import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { CertificateAlertEntity } from '../certificate-alert.entity/certificate-alert.entity';

@Entity({ name: 'certificates' })
@Index('IDX_certificates_report', ['courseId', 'employeeId', 'expiresAt'])
@Check('CHK_certificates_expiry', 'expires_at > issued_at')
export class CertificateEntity extends AppBaseEntity {
  @Index({ unique: true })
  @Column({ name: 'certificate_number', length: 80 })
  certificateNumber!: string;

  @Column({ name: 'employee_id', type: 'uuid' })
  employeeId!: string;

  @ManyToOne(() => EmployeeEntity, (employee) => employee.certificates, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'employee_id' })
  employee!: EmployeeEntity;

  @Column({ name: 'course_id', type: 'uuid' })
  courseId!: string;

  @ManyToOne(() => CourseEntity, (course) => course.certificates, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'course_id' })
  course!: CourseEntity;

  @Index({ unique: true })
  @Column({ name: 'enrollment_id', type: 'uuid' })
  enrollmentId!: string;

  @OneToOne(() => EnrollmentEntity, (enrollment) => enrollment.certificate, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'enrollment_id' })
  enrollment!: EnrollmentEntity;

  @Column({ name: 'issued_at', type: 'timestamptz' })
  issuedAt!: Date;

  @Index()
  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  @OneToMany(() => CertificateAlertEntity, (alert) => alert.certificate)
  alerts?: CertificateAlertEntity[];
}
