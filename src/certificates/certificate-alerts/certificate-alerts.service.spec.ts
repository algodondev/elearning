import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRole } from '../../auth/entities/user.entity/user.entity';
import {
  CertificateStatus,
  ListCertificateAlertsDto,
} from '../dto/certificate.dto/certificate.dto';
import {
  CertificateAlertStatus,
  CertificateAlertType,
} from '../entities/certificate-alert.entity/certificate-alert.entity';
import { CertificateAlertsService } from './certificate-alerts.service';

const queryBuilder = () => ({
  where: jest.fn().mockReturnThis(),
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  values: jest.fn().mockReturnThis(),
  orIgnore: jest.fn().mockReturnThis(),
  getMany: jest.fn(),
  getManyAndCount: jest.fn(),
  execute: jest.fn(),
});

describe('CertificateAlertsService', () => {
  const now = new Date('2026-07-20T00:00:00.000Z');
  let alertBuilder: ReturnType<typeof queryBuilder>;
  let certificateBuilder: ReturnType<typeof queryBuilder>;
  let alerts: {
    createQueryBuilder: jest.Mock;
    findOneBy: jest.Mock;
    save: jest.Mock;
  };
  let certificates: { createQueryBuilder: jest.Mock };
  let certificateService: { getStatus: jest.Mock };
  let service: CertificateAlertsService;

  beforeEach(() => {
    alertBuilder = queryBuilder();
    certificateBuilder = queryBuilder();
    alerts = {
      createQueryBuilder: jest.fn(() => alertBuilder),
      findOneBy: jest.fn(),
      save: jest.fn((value) => Promise.resolve(value)),
    };
    certificates = {
      createQueryBuilder: jest.fn(() => certificateBuilder),
    };
    certificateService = { getStatus: jest.fn() };
    service = new CertificateAlertsService(
      alerts as never,
      certificates as never,
      certificateService as never,
      { now: () => now },
    );
  });

  it('does no insert when no certificate is within the alert window', async () => {
    certificateBuilder.getMany.mockResolvedValue([]);

    await expect(service.run()).resolves.toEqual({ processed: 0, created: 0 });
    expect(alerts.createQueryBuilder).not.toHaveBeenCalled();
    expect(certificateBuilder.where).toHaveBeenCalledWith(
      'certificate.expiresAt <= :soon',
      { soon: new Date('2026-08-19T00:00:00.000Z') },
    );
  });

  it('creates idempotent expired and expiring alerts', async () => {
    certificateBuilder.getMany.mockResolvedValue([
      { id: 'cert-expired', employeeId: 'employee-1', expiresAt: now },
      {
        id: 'cert-soon',
        employeeId: 'employee-2',
        expiresAt: new Date('2026-07-21T00:00:00.000Z'),
      },
    ]);
    certificateService.getStatus
      .mockReturnValueOnce(CertificateStatus.EXPIRED)
      .mockReturnValueOnce(CertificateStatus.EXPIRING_SOON);
    alertBuilder.execute.mockResolvedValue({ identifiers: [{ id: 'one' }] });

    await expect(service.run()).resolves.toEqual({ processed: 2, created: 1 });
    expect(alertBuilder.values).toHaveBeenCalledWith([
      expect.objectContaining({
        certificateId: 'cert-expired',
        alertType: CertificateAlertType.EXPIRED,
        status: CertificateAlertStatus.PENDING,
      }),
      expect.objectContaining({
        certificateId: 'cert-soon',
        alertType: CertificateAlertType.EXPIRING_30_DAYS,
      }),
    ]);
    expect(alertBuilder.orIgnore).toHaveBeenCalled();
  });

  it.each([
    [
      'employee ownership',
      { role: UserRole.EMPLOYEE, employeeId: 'owner' },
      new ListCertificateAlertsDto(),
      ['alert.employeeId = :ownerId', { ownerId: 'owner' }],
    ],
    [
      'HR employee filter',
      { role: UserRole.HR_MANAGER },
      Object.assign(new ListCertificateAlertsDto(), {
        employeeId: 'employee-2',
      }),
      ['alert.employeeId = :employeeId', { employeeId: 'employee-2' }],
    ],
  ])('lists alerts with %s', async (_label, user, query, expectedWhere) => {
    Object.assign(query, {
      status: CertificateAlertStatus.PENDING,
      alertType: CertificateAlertType.EXPIRED,
      page: 2,
      limit: 5,
    });
    alertBuilder.getManyAndCount.mockResolvedValue([[{ id: 'alert-1' }], 6]);

    const result = await service.list(query, user as never);

    expect(alertBuilder.andWhere).toHaveBeenCalledWith(
      expectedWhere[0],
      expect.objectContaining(expectedWhere[1] as object),
    );
    expect(alertBuilder.andWhere).toHaveBeenCalledWith(
      'alert.status = :status',
      query,
    );
    expect(alertBuilder.andWhere).toHaveBeenCalledWith(
      'alert.alertType = :alertType',
      query,
    );
    expect(alertBuilder.skip).toHaveBeenCalledWith(5);
    expect(result.meta).toEqual({
      page: 2,
      limit: 5,
      totalItems: 6,
      totalPages: 2,
    });
  });

  it('lists all alerts for an admin when filters are absent', async () => {
    alertBuilder.getManyAndCount.mockResolvedValue([[], 0]);

    const result = await service.list(new ListCertificateAlertsDto(), {
      role: UserRole.ADMIN,
    } as never);

    expect(alertBuilder.andWhere).not.toHaveBeenCalled();
    expect(result.data).toEqual([]);
  });

  it('rejects an unknown alert', async () => {
    alerts.findOneBy.mockResolvedValue(null);

    await expect(
      service.markRead('missing', { role: UserRole.ADMIN } as never),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects an employee acknowledging another employee alert', async () => {
    alerts.findOneBy.mockResolvedValue({
      id: 'alert-1',
      employeeId: 'other',
      status: CertificateAlertStatus.PENDING,
    });

    await expect(
      service.markRead('alert-1', {
        role: UserRole.EMPLOYEE,
        employeeId: 'owner',
      } as never),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('acknowledges a pending alert and is idempotent when already read', async () => {
    const pending = {
      id: 'alert-1',
      employeeId: 'owner',
      status: CertificateAlertStatus.PENDING,
      readAt: null,
    };
    alerts.findOneBy.mockResolvedValueOnce(pending);

    await expect(
      service.markRead('alert-1', {
        role: UserRole.EMPLOYEE,
        employeeId: 'owner',
      } as never),
    ).resolves.toMatchObject({
      status: CertificateAlertStatus.READ,
      readAt: now,
    });
    expect(alerts.save).toHaveBeenCalled();

    const alreadyRead = { ...pending, status: CertificateAlertStatus.READ };
    alerts.findOneBy.mockResolvedValueOnce(alreadyRead);
    await expect(
      service.markRead('alert-1', { role: UserRole.ADMIN } as never),
    ).resolves.toBe(alreadyRead);
    expect(alerts.save).toHaveBeenCalledTimes(1);
  });
});
