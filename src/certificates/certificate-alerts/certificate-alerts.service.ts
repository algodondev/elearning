import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../../auth/entities/user.entity/user.entity';
import type { AuthenticatedUser } from '../../auth/strategies/jwt.strategy/jwt.strategy';
import { paginate } from '../../common/dto/pagination.dto/pagination.dto';
import { Clock } from '../../common/time/clock/clock';
import {
  CertificateStatus,
  ListCertificateAlertsDto,
} from '../dto/certificate.dto/certificate.dto';
import {
  CertificateAlertEntity,
  CertificateAlertStatus,
  CertificateAlertType,
} from '../entities/certificate-alert.entity/certificate-alert.entity';
import { CertificateEntity } from '../entities/certificate.entity/certificate.entity';
import { CertificatesService } from '../certificates.service';

@Injectable()
export class CertificateAlertsService {
  constructor(
    @InjectRepository(CertificateAlertEntity)
    private readonly alerts: Repository<CertificateAlertEntity>,
    @InjectRepository(CertificateEntity)
    private readonly certificates: Repository<CertificateEntity>,
    private readonly certificateService: CertificatesService,
    private readonly clock: Clock,
  ) {}

  async run() {
    const now = this.clock.now();
    const soon = new Date(now.getTime() + 30 * 86400000);
    const eligible = await this.certificates
      .createQueryBuilder('certificate')
      .where('certificate.expiresAt <= :soon', { soon })
      .getMany();
    const values = eligible.map((certificate) => ({
      certificateId: certificate.id,
      employeeId: certificate.employeeId,
      alertType:
        this.certificateService.getStatus(certificate.expiresAt, now) ===
        CertificateStatus.EXPIRED
          ? CertificateAlertType.EXPIRED
          : CertificateAlertType.EXPIRING_30_DAYS,
      status: CertificateAlertStatus.PENDING,
      alertedAt: now,
      readAt: null,
    }));
    if (!values.length) return { processed: 0, created: 0 };
    const inserted = await this.alerts
      .createQueryBuilder()
      .insert()
      .values(values)
      .orIgnore()
      .execute();
    return {
      processed: values.length,
      created: inserted.identifiers.length,
    };
  }

  async list(query: ListCertificateAlertsDto, user: AuthenticatedUser) {
    const builder = this.alerts
      .createQueryBuilder('alert')
      .leftJoinAndSelect('alert.certificate', 'certificate')
      .leftJoinAndSelect('certificate.course', 'course')
      .leftJoinAndSelect('alert.employee', 'employee');
    if (user.role === UserRole.EMPLOYEE) {
      builder.andWhere('alert.employeeId = :ownerId', {
        ownerId: user.employeeId,
      });
    } else if (query.employeeId) {
      builder.andWhere('alert.employeeId = :employeeId', query);
    }
    if (query.status) builder.andWhere('alert.status = :status', query);
    if (query.alertType)
      builder.andWhere('alert.alertType = :alertType', query);
    builder
      .orderBy('alert.alertedAt', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);
    const [data, total] = await builder.getManyAndCount();
    return paginate(data, total, query.page, query.limit);
  }

  async markRead(id: string, user: AuthenticatedUser) {
    const alert = await this.alerts.findOneBy({ id });
    if (!alert) throw new NotFoundException('Certificate alert not found.');
    if (user.role === UserRole.EMPLOYEE && user.employeeId !== alert.employeeId)
      throw new ForbiddenException(
        'Employees may only acknowledge their own alerts.',
      );
    if (alert.status === CertificateAlertStatus.READ) return alert;
    alert.status = CertificateAlertStatus.READ;
    alert.readAt = this.clock.now();
    return this.alerts.save(alert);
  }
}
