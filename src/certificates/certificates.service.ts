import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../auth/entities/user.entity/user.entity';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy/jwt.strategy';
import { paginate } from '../common/dto/pagination.dto/pagination.dto';
import {
  CertificateStatus,
  ListCertificatesDto,
} from './dto/certificate.dto/certificate.dto';
import { CertificateEntity } from './entities/certificate.entity/certificate.entity';

export { CertificateStatus };

@Injectable()
export class CertificatesService {
  constructor(
    @InjectRepository(CertificateEntity)
    private readonly certificates: Repository<CertificateEntity>,
  ) {}

  getStatus(expiresAt: Date, asOf = new Date()): CertificateStatus {
    if (expiresAt.getTime() <= asOf.getTime()) {
      return CertificateStatus.EXPIRED;
    }

    const thirtyDaysFromNow = asOf.getTime() + 30 * 24 * 60 * 60 * 1000;
    if (expiresAt.getTime() <= thirtyDaysFromNow) {
      return CertificateStatus.EXPIRING_SOON;
    }

    return CertificateStatus.VALID;
  }

  async list(query: ListCertificatesDto, user: AuthenticatedUser) {
    const asOf = query.asOf ? new Date(query.asOf) : new Date();
    const builder = this.certificates
      .createQueryBuilder('certificate')
      .leftJoinAndSelect('certificate.course', 'course')
      .leftJoinAndSelect('certificate.employee', 'employee');
    if (user.role === UserRole.EMPLOYEE)
      builder.andWhere('certificate.employeeId = :owner', {
        owner: user.employeeId,
      });
    else if (query.employeeId)
      builder.andWhere('certificate.employeeId = :employeeId', query);
    if (query.courseId)
      builder.andWhere('certificate.courseId = :courseId', query);
    if (query.status === CertificateStatus.EXPIRED)
      builder.andWhere('certificate.expiresAt <= :asOf', { asOf });
    if (query.status === CertificateStatus.EXPIRING_SOON)
      builder.andWhere(
        'certificate.expiresAt > :asOf AND certificate.expiresAt <= :soon',
        {
          asOf,
          soon: new Date(asOf.getTime() + 30 * 86400000),
        },
      );
    if (query.status === CertificateStatus.VALID)
      builder.andWhere('certificate.expiresAt > :soon', {
        soon: new Date(asOf.getTime() + 30 * 86400000),
      });
    builder
      .orderBy('certificate.expiresAt', 'ASC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);
    const [rows, total] = await builder.getManyAndCount();
    return paginate(
      rows.map((row) => this.toResponse(row, asOf)),
      total,
      query.page,
      query.limit,
    );
  }

  async get(id: string, user: AuthenticatedUser, asOf = new Date()) {
    const certificate = await this.certificates.findOne({
      where: { id },
      relations: { course: true, employee: true },
    });
    if (!certificate) throw new NotFoundException('Certificate not found.');
    if (
      user.role === UserRole.EMPLOYEE &&
      user.employeeId !== certificate.employeeId
    )
      throw new ForbiddenException(
        'Employees may only access their own certificates.',
      );
    return this.toResponse(certificate, asOf);
  }

  employeeCertificates(employeeId: string, user: AuthenticatedUser) {
    if (user.role === UserRole.EMPLOYEE && user.employeeId !== employeeId)
      throw new ForbiddenException(
        'Employees may only access their own certificates.',
      );
    const query = new ListCertificatesDto();
    query.employeeId = employeeId;
    return this.list(query, user);
  }

  private toResponse(certificate: CertificateEntity, asOf: Date) {
    return {
      ...certificate,
      status: this.getStatus(certificate.expiresAt, asOf),
    };
  }
}
