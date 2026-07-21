import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRole } from '../auth/entities/user.entity/user.entity';
import {
  CertificateStatus,
  ListCertificatesDto,
} from './dto/certificate.dto/certificate.dto';
import { CertificatesService } from './certificates.service';

type CertificateApi = {
  getStatus: (expiresAt: Date, asOf: Date) => string;
};

describe('CertificatesService time classification', () => {
  const service = new CertificatesService() as unknown as CertificateApi;
  const asOf = new Date('2026-07-20T00:00:00.000Z');

  it.each([
    ['2026-08-20T00:00:00.000Z', 'VALID'],
    ['2026-08-19T00:00:00.000Z', 'EXPIRING_SOON'],
    ['2026-07-21T00:00:00.000Z', 'EXPIRING_SOON'],
    ['2026-07-20T00:00:00.000Z', 'EXPIRED'],
    ['2026-07-19T23:59:59.999Z', 'EXPIRED'],
  ])('classifies %s as %s', (expiresAt, expected) => {
    expect(service.getStatus(new Date(expiresAt), asOf)).toBe(expected);
  });

  it('uses the wall clock when no classification instant is supplied', () => {
    expect(service.getStatus(new Date(Date.now() + 31 * 86400000))).toBe(
      CertificateStatus.VALID,
    );
  });
});

const queryBuilder = () => ({
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn(),
});

describe('CertificatesService access and filtering', () => {
  let builder: ReturnType<typeof queryBuilder>;
  let repository: {
    createQueryBuilder: jest.Mock;
    findOne: jest.Mock;
  };
  let service: CertificatesService;

  beforeEach(() => {
    builder = queryBuilder();
    repository = {
      createQueryBuilder: jest.fn(() => builder),
      findOne: jest.fn(),
    };
    service = new CertificatesService(repository as never);
  });

  it.each([
    [CertificateStatus.EXPIRED, 'certificate.expiresAt <= :asOf'],
    [
      CertificateStatus.EXPIRING_SOON,
      'certificate.expiresAt > :asOf AND certificate.expiresAt <= :soon',
    ],
    [CertificateStatus.VALID, 'certificate.expiresAt > :soon'],
  ])('applies the %s status interval', async (status, expectedClause) => {
    const query = Object.assign(new ListCertificatesDto(), {
      asOf: '2026-07-20T00:00:00.000Z',
      employeeId: 'employee-1',
      courseId: 'course-1',
      status,
      page: 2,
      limit: 5,
    });
    builder.getManyAndCount.mockResolvedValue([
      [
        {
          id: 'certificate-1',
          expiresAt: new Date('2026-07-20T00:00:00.000Z'),
        },
      ],
      6,
    ]);

    const result = await service.list(query, {
      role: UserRole.HR_MANAGER,
    } as never);

    expect(builder.andWhere).toHaveBeenCalledWith(
      'certificate.employeeId = :employeeId',
      query,
    );
    expect(builder.andWhere).toHaveBeenCalledWith(
      'certificate.courseId = :courseId',
      query,
    );
    expect(builder.andWhere).toHaveBeenCalledWith(
      expectedClause,
      expect.any(Object),
    );
    expect(builder.skip).toHaveBeenCalledWith(5);
    expect(result.meta.totalPages).toBe(2);
  });

  it('forces employee ownership and uses defaults without filters', async () => {
    builder.getManyAndCount.mockResolvedValue([[], 0]);

    const result = await service.list(new ListCertificatesDto(), {
      role: UserRole.EMPLOYEE,
      employeeId: 'owner',
    } as never);

    expect(builder.andWhere).toHaveBeenCalledWith(
      'certificate.employeeId = :owner',
      { owner: 'owner' },
    );
    expect(result.data).toEqual([]);
  });

  it('gets an owned certificate with derived status', async () => {
    repository.findOne.mockResolvedValue({
      id: 'certificate-1',
      employeeId: 'owner',
      expiresAt: new Date('2026-07-21T00:00:00.000Z'),
    });

    await expect(
      service.get(
        'certificate-1',
        { role: UserRole.EMPLOYEE, employeeId: 'owner' } as never,
        new Date('2026-07-20T00:00:00.000Z'),
      ),
    ).resolves.toMatchObject({ status: CertificateStatus.EXPIRING_SOON });
  });

  it('rejects a missing certificate and foreign employee access', async () => {
    repository.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({
      id: 'certificate-1',
      employeeId: 'other',
      expiresAt: new Date('2027-01-01T00:00:00.000Z'),
    });

    await expect(
      service.get('missing', { role: UserRole.ADMIN } as never),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      service.get('certificate-1', {
        role: UserRole.EMPLOYEE,
        employeeId: 'owner',
      } as never),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects another employee history and delegates permitted history', async () => {
    expect(() =>
      service.employeeCertificates('other', {
        role: UserRole.EMPLOYEE,
        employeeId: 'owner',
      } as never),
    ).toThrow(ForbiddenException);

    builder.getManyAndCount.mockResolvedValue([[], 0]);
    await service.employeeCertificates('employee-1', {
      role: UserRole.HR_MANAGER,
    } as never);
    expect(builder.andWhere).toHaveBeenCalledWith(
      'certificate.employeeId = :employeeId',
      expect.objectContaining({ employeeId: 'employee-1' }),
    );
  });
});
