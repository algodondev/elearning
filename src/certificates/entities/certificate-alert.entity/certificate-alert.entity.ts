import { AppBaseEntity } from '../../../common/entities/base.entity/base.entity';
import { EmployeeEntity } from '../../../employees/entities/employee.entity/employee.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { CertificateEntity } from '../certificate.entity/certificate.entity';

export enum CertificateAlertType {
  EXPIRING_30_DAYS = 'EXPIRING_30_DAYS',
  EXPIRED = 'EXPIRED',
}

export enum CertificateAlertStatus {
  PENDING = 'PENDING',
  READ = 'READ',
}

@Entity({ name: 'certificate_alerts' })
@Unique('UQ_certificate_alert_type', ['certificateId', 'alertType'])
@Index('IDX_certificate_alerts_employee_status_type', [
  'employeeId',
  'status',
  'alertType',
])
export class CertificateAlertEntity extends AppBaseEntity {
  @Column({ name: 'certificate_id', type: 'uuid' })
  certificateId!: string;

  @ManyToOne(() => CertificateEntity, (certificate) => certificate.alerts, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'certificate_id' })
  certificate!: CertificateEntity;

  @Column({ name: 'employee_id', type: 'uuid' })
  employeeId!: string;

  @ManyToOne(() => EmployeeEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'employee_id' })
  employee!: EmployeeEntity;

  @Column({ name: 'alert_type', type: 'enum', enum: CertificateAlertType })
  alertType!: CertificateAlertType;

  @Column({
    type: 'enum',
    enum: CertificateAlertStatus,
    default: CertificateAlertStatus.PENDING,
  })
  status!: CertificateAlertStatus;

  @Column({ name: 'alerted_at', type: 'timestamptz' })
  alertedAt!: Date;

  @Column({ name: 'read_at', type: 'timestamptz', nullable: true })
  readAt!: Date | null;
}
