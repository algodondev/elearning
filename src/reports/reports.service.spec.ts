import { NotFoundException } from '@nestjs/common';
import { ComplianceReportQueryDto } from './dto/report.dto/report.dto';
import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  const now = new Date('2026-07-20T12:00:00.000Z');
  const dataSource = { query: jest.fn() };
  const clock = { now: jest.fn(() => now) };
  const service = new ReportsService(dataSource as never, clock);

  beforeEach(() => jest.clearAllMocks());

  it('maps summary counts, rounds percentages, and honors filters', async () => {
    dataSource.query.mockResolvedValueOnce([
      {
        area_id: 'area-1',
        area_name: 'Operations',
        course_id: 'course-1',
        course_code: 'SAFE-101',
        course_title: 'Safety',
        applicable_active_employees: '3',
        valid_certificate_employees: '2',
        expired_only_employees: '1',
        never_certified_employees: '0',
        total_rows: '2',
      },
      {
        area_id: 'area-2',
        area_name: 'Empty area',
        course_id: 'course-1',
        course_code: 'SAFE-101',
        course_title: 'Safety',
        applicable_active_employees: 0,
        valid_certificate_employees: 0,
        expired_only_employees: 0,
        never_certified_employees: 0,
        total_rows: 2,
      },
    ]);
    const query = Object.assign(new ComplianceReportQueryDto(), {
      asOf: '2026-07-01T00:00:00.000Z',
      courseId: 'course-1',
      page: 2,
      limit: 10,
    });

    const result = await service.complianceByArea(query);

    expect(dataSource.query).toHaveBeenCalledWith(expect.any(String), [
      '2026-07-01T00:00:00.000Z',
      'course-1',
      10,
      10,
    ]);
    expect(result.data).toEqual([
      expect.objectContaining({
        applicableActiveEmployees: 3,
        validCertificateEmployees: 2,
        expiredOnlyEmployees: 1,
        compliancePercentage: 66.67,
      }),
      expect.objectContaining({ compliancePercentage: 0 }),
    ]);
    expect(result.meta).toEqual({
      page: 2,
      limit: 10,
      totalItems: 2,
      totalPages: 1,
    });
  });

  it('uses the injected clock and returns empty summary pagination', async () => {
    dataSource.query.mockResolvedValueOnce([]);

    const result = await service.complianceByArea(
      new ComplianceReportQueryDto(),
    );

    expect(clock.now).toHaveBeenCalled();
    expect(dataSource.query).toHaveBeenCalledWith(expect.any(String), [
      now.toISOString(),
      null,
      20,
      0,
    ]);
    expect(result).toEqual({
      data: [],
      meta: { page: 1, limit: 20, totalItems: 0, totalPages: 0 },
    });
  });

  it('classifies detail rows as valid, expired-only, or never certified', async () => {
    dataSource.query
      .mockResolvedValueOnce([{ exists: true }])
      .mockResolvedValueOnce([
        {
          employee_id: 'employee-1',
          employee_code: 'EMP-1',
          employee_name: 'Valid Learner',
          course_id: 'course-1',
          course_code: 'SAFE-101',
          has_valid: true,
          has_expired: true,
          total_rows: '3',
        },
        {
          employee_id: 'employee-2',
          employee_code: 'EMP-2',
          employee_name: 'Expired Learner',
          course_id: 'course-1',
          course_code: 'SAFE-101',
          has_valid: false,
          has_expired: true,
          total_rows: '3',
        },
        {
          employee_id: 'employee-3',
          employee_code: 'EMP-3',
          employee_name: 'New Learner',
          course_id: 'course-1',
          course_code: 'SAFE-101',
          has_valid: false,
          has_expired: false,
          total_rows: '3',
        },
      ]);
    const query = Object.assign(new ComplianceReportQueryDto(), {
      asOf: '2026-07-01T00:00:00.000Z',
      courseId: 'course-1',
      page: 1,
      limit: 10,
    });

    const result = await service.complianceAreaDetail('area-1', query);

    expect(result.data.map(({ status }) => status)).toEqual([
      'VALID',
      'EXPIRED_ONLY',
      'NEVER_CERTIFIED',
    ]);
    expect(dataSource.query).toHaveBeenNthCalledWith(2, expect.any(String), [
      '2026-07-01T00:00:00.000Z',
      'area-1',
      'course-1',
      10,
      0,
    ]);
  });

  it('returns an empty detail page using the injected clock', async () => {
    dataSource.query
      .mockResolvedValueOnce([{ exists: true }])
      .mockResolvedValueOnce([]);

    const result = await service.complianceAreaDetail(
      'area-1',
      new ComplianceReportQueryDto(),
    );

    expect(result.asOf).toBe(now.toISOString());
    expect(result.meta.totalItems).toBe(0);
  });

  it('rejects a missing or inactive area', async () => {
    dataSource.query.mockResolvedValueOnce([]);

    await expect(
      service.complianceAreaDetail('missing', new ComplianceReportQueryDto()),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
