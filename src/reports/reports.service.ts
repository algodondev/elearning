import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { paginate } from '../common/dto/pagination.dto/pagination.dto';
import { Clock } from '../common/time/clock/clock';
import {
  ComplianceReportQueryDto,
  EmployeeComplianceStatus,
} from './dto/report.dto/report.dto';

interface SummaryRow {
  area_id: string;
  area_name: string;
  course_id: string;
  course_code: string;
  course_title: string;
  applicable_active_employees: number | string;
  valid_certificate_employees: number | string;
  expired_only_employees: number | string;
  never_certified_employees: number | string;
  total_rows: number | string;
}

interface DetailRow {
  employee_id: string;
  employee_code: string;
  employee_name: string;
  course_id: string;
  course_code: string;
  has_valid: boolean;
  has_expired: boolean;
  total_rows: number | string;
}

@Injectable()
export class ReportsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly clock: Clock,
  ) {}

  async complianceByArea(query: ComplianceReportQueryDto) {
    const asOf = query.asOf ? new Date(query.asOf) : this.clock.now();
    const rows = await this.dataSource.query<SummaryRow[]>(
      `
        WITH employee_course AS (
          SELECT
            area.id AS area_id,
            area.name AS area_name,
            course.id AS course_id,
            course.code AS course_code,
            course.title AS course_title,
            employee.id AS employee_id,
            COALESCE(certificate_state.has_valid, FALSE) AS has_valid,
            COALESCE(certificate_state.has_expired, FALSE) AS has_expired
          FROM areas area
          CROSS JOIN courses course
          LEFT JOIN employees employee
            ON employee.area_id = area.id
           AND employee.is_active = TRUE
          LEFT JOIN LATERAL (
            SELECT
              BOOL_OR(certificate.expires_at > $1::timestamptz) AS has_valid,
              BOOL_OR(certificate.expires_at <= $1::timestamptz) AS has_expired
            FROM certificates certificate
            WHERE certificate.employee_id = employee.id
              AND certificate.course_id = course.id
          ) certificate_state ON employee.id IS NOT NULL
          WHERE area.is_active = TRUE
            AND course.is_mandatory = TRUE
            AND course.status = 'PUBLISHED'
            AND ($2::uuid IS NULL OR course.id = $2::uuid)
        ), aggregated AS (
          SELECT
            area_id,
            area_name,
            course_id,
            course_code,
            course_title,
            COUNT(employee_id)::int AS applicable_active_employees,
            COUNT(employee_id) FILTER (WHERE has_valid)::int AS valid_certificate_employees,
            COUNT(employee_id) FILTER (WHERE NOT has_valid AND has_expired)::int AS expired_only_employees,
            COUNT(employee_id) FILTER (WHERE NOT has_valid AND NOT has_expired)::int AS never_certified_employees
          FROM employee_course
          GROUP BY area_id, area_name, course_id, course_code, course_title
        )
        SELECT aggregated.*, COUNT(*) OVER()::int AS total_rows
        FROM aggregated
        ORDER BY area_name ASC, course_code ASC
        LIMIT $3 OFFSET $4
      `,
      [
        asOf.toISOString(),
        query.courseId ?? null,
        query.limit,
        (query.page - 1) * query.limit,
      ],
    );
    const total = Number(rows[0]?.total_rows ?? 0);
    return paginate(
      rows.map((row) => {
        const applicable = Number(row.applicable_active_employees);
        const valid = Number(row.valid_certificate_employees);
        return {
          areaId: row.area_id,
          areaName: row.area_name,
          courseId: row.course_id,
          courseCode: row.course_code,
          courseTitle: row.course_title,
          asOf: asOf.toISOString(),
          applicableActiveEmployees: applicable,
          validCertificateEmployees: valid,
          expiredOnlyEmployees: Number(row.expired_only_employees),
          neverCertifiedEmployees: Number(row.never_certified_employees),
          compliancePercentage: applicable
            ? Math.round((valid / applicable) * 10000) / 100
            : 0,
        };
      }),
      total,
      query.page,
      query.limit,
    );
  }

  async complianceAreaDetail(areaId: string, query: ComplianceReportQueryDto) {
    const areaExists = await this.dataSource.query<{ exists: boolean }[]>(
      'SELECT EXISTS(SELECT 1 FROM areas WHERE id = $1::uuid AND is_active = TRUE) AS exists',
      [areaId],
    );
    if (!areaExists[0]?.exists)
      throw new NotFoundException('Active area not found.');
    const asOf = query.asOf ? new Date(query.asOf) : this.clock.now();
    const rows = await this.dataSource.query<DetailRow[]>(
      `
        SELECT
          employee.id AS employee_id,
          employee.employee_code,
          CONCAT(employee.first_name, ' ', employee.last_name) AS employee_name,
          course.id AS course_id,
          course.code AS course_code,
          COALESCE(certificate_state.has_valid, FALSE) AS has_valid,
          COALESCE(certificate_state.has_expired, FALSE) AS has_expired,
          COUNT(*) OVER()::int AS total_rows
        FROM employees employee
        CROSS JOIN courses course
        LEFT JOIN LATERAL (
          SELECT
            BOOL_OR(certificate.expires_at > $1::timestamptz) AS has_valid,
            BOOL_OR(certificate.expires_at <= $1::timestamptz) AS has_expired
          FROM certificates certificate
          WHERE certificate.employee_id = employee.id
            AND certificate.course_id = course.id
        ) certificate_state ON TRUE
        WHERE employee.area_id = $2::uuid
          AND employee.is_active = TRUE
          AND course.is_mandatory = TRUE
          AND course.status = 'PUBLISHED'
          AND ($3::uuid IS NULL OR course.id = $3::uuid)
        ORDER BY course.code ASC, employee.employee_code ASC
        LIMIT $4 OFFSET $5
      `,
      [
        asOf.toISOString(),
        areaId,
        query.courseId ?? null,
        query.limit,
        (query.page - 1) * query.limit,
      ],
    );
    return {
      areaId,
      asOf: asOf.toISOString(),
      ...paginate(
        rows.map((row) => ({
          employeeId: row.employee_id,
          employeeCode: row.employee_code,
          employeeName: row.employee_name,
          courseId: row.course_id,
          courseCode: row.course_code,
          status: row.has_valid
            ? EmployeeComplianceStatus.VALID
            : row.has_expired
              ? EmployeeComplianceStatus.EXPIRED_ONLY
              : EmployeeComplianceStatus.NEVER_CERTIFIED,
        })),
        Number(rows[0]?.total_rows ?? 0),
        query.page,
        query.limit,
      ),
    };
  }
}
