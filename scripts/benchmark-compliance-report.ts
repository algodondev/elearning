import dataSource from '../src/database/data-source/data-source';
import { COMPLIANCE_SUMMARY_SQL } from '../src/reports/reports.service';

const PERFORMANCE_DATABASE_SUFFIX = '_performance';
const AS_OF = '2026-07-20T00:00:00.000Z';
const RUNS = 25;

function percentile(values: number[], fraction: number) {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.ceil(sorted.length * fraction) - 1];
}

function collectIndexNames(node: Record<string, unknown>, result: Set<string>) {
  if (typeof node['Index Name'] === 'string') result.add(node['Index Name']);
  const plans = node.Plans;
  if (Array.isArray(plans)) {
    for (const child of plans) {
      collectIndexNames(child as Record<string, unknown>, result);
    }
  }
}

async function loadFixture() {
  await dataSource.query(
    'TRUNCATE TABLE areas, job_levels, users, courses RESTART IDENTITY CASCADE',
  );
  await dataSource.query(`
    INSERT INTO areas (name, description, is_active)
    SELECT FORMAT('Performance Area %s', value), 'Benchmark fixture', TRUE
    FROM GENERATE_SERIES(1, 10) AS value
  `);
  await dataSource.query(`
    INSERT INTO job_levels (name, rank_order, description, is_active)
    VALUES ('Performance Level', 1, 'Benchmark fixture', TRUE)
  `);
  await dataSource.query(`
    INSERT INTO users (email, password_hash, role, is_active)
    SELECT
      FORMAT('performance-%s@example.invalid', value),
      'benchmark-only-not-a-login-hash',
      'EMPLOYEE',
      TRUE
    FROM GENERATE_SERIES(1, 5000) AS value
  `);
  await dataSource.query(`
    WITH numbered_users AS (
      SELECT id, ROW_NUMBER() OVER (ORDER BY email) AS row_number
      FROM users
    ), numbered_areas AS (
      SELECT id, ROW_NUMBER() OVER (ORDER BY name) AS row_number
      FROM areas
    )
    INSERT INTO employees (
      user_id, employee_code, first_name, last_name, area_id,
      job_level_id, hire_date, is_active
    )
    SELECT
      numbered_users.id,
      FORMAT('PERF-%s', LPAD(numbered_users.row_number::text, 5, '0')),
      'Performance',
      FORMAT('Learner %s', numbered_users.row_number),
      numbered_areas.id,
      job_levels.id,
      '2020-01-01',
      TRUE
    FROM numbered_users
    JOIN numbered_areas
      ON numbered_areas.row_number = ((numbered_users.row_number - 1) % 10) + 1
    CROSS JOIN job_levels
  `);
  await dataSource.query(`
    INSERT INTO courses (
      code, title, description, estimated_duration_minutes,
      is_mandatory, certificate_validity_days, status
    )
    SELECT
      FORMAT('PERF-%s', LPAD(value::text, 3, '0')),
      FORMAT('Performance Course %s', value),
      'Benchmark fixture',
      30,
      TRUE,
      365,
      'PUBLISHED'
    FROM GENERATE_SERIES(1, 30) AS value
  `);
  await dataSource.query(
    `
    WITH employee_course AS (
      SELECT
        employee.id AS employee_id,
        course.id AS course_id,
        ROW_NUMBER() OVER (ORDER BY employee.id, course.id) AS row_number
      FROM employees employee
      CROSS JOIN courses course
      LIMIT 100000
    )
    INSERT INTO enrollments (
      employee_id, course_id, status, enrolled_at, ready_at, passed_at
    )
    SELECT
      employee_id,
      course_id,
      'PASSED',
      $1::timestamptz - INTERVAL '400 days',
      $1::timestamptz - INTERVAL '390 days',
      $1::timestamptz - INTERVAL '380 days'
    FROM employee_course
  `,
    [AS_OF],
  );
  await dataSource.query(
    `
    WITH numbered_enrollments AS (
      SELECT
        id,
        employee_id,
        course_id,
        ROW_NUMBER() OVER (ORDER BY id) AS row_number
      FROM enrollments
    )
    INSERT INTO certificates (
      certificate_number, employee_id, course_id, enrollment_id,
      issued_at, expires_at
    )
    SELECT
      FORMAT('PERF-CERT-%s', LPAD(row_number::text, 6, '0')),
      employee_id,
      course_id,
      id,
      $1::timestamptz - INTERVAL '400 days',
      CASE row_number % 3
        WHEN 0 THEN $1::timestamptz - INTERVAL '30 days'
        WHEN 1 THEN $1::timestamptz + INTERVAL '15 days'
        ELSE $1::timestamptz + INTERVAL '365 days'
      END
    FROM numbered_enrollments
  `,
    [AS_OF],
  );
  await dataSource.query(
    'ANALYZE areas, courses, employees, enrollments, certificates',
  );
}

async function main() {
  const databaseName = process.env.DB_NAME ?? '';
  if (!databaseName.endsWith(PERFORMANCE_DATABASE_SUFFIX)) {
    throw new Error(
      `Refusing to replace data in ${databaseName || '<unset>'}; DB_NAME must end with ${PERFORMANCE_DATABASE_SUFFIX}.`,
    );
  }

  await dataSource.initialize();
  const fixtureStarted = performance.now();
  await loadFixture();
  const fixtureSeconds = (performance.now() - fixtureStarted) / 1000;
  const parameters = [AS_OF, null, 100, 0];

  await dataSource.query(COMPLIANCE_SUMMARY_SQL, parameters);
  const durations: number[] = [];
  for (let run = 0; run < RUNS; run += 1) {
    const started = performance.now();
    await dataSource.query(COMPLIANCE_SUMMARY_SQL, parameters);
    durations.push(performance.now() - started);
  }

  const explainRows = await dataSource.query<
    Array<{ 'QUERY PLAN': Array<Record<string, unknown>> }>
  >(
    `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${COMPLIANCE_SUMMARY_SQL}`,
    parameters,
  );
  const explain = explainRows[0]['QUERY PLAN'][0];
  const plan = explain.Plan as Record<string, unknown>;
  const indexes = new Set<string>();
  collectIndexNames(plan, indexes);
  const counts = await dataSource.query<
    Array<{
      employees: string;
      areas: string;
      courses: string;
      certificates: string;
    }>
  >(`
    SELECT
      (SELECT COUNT(*) FROM employees)::text AS employees,
      (SELECT COUNT(*) FROM areas)::text AS areas,
      (SELECT COUNT(*) FROM courses)::text AS courses,
      (SELECT COUNT(*) FROM certificates)::text AS certificates
  `);

  process.stdout.write(
    `${JSON.stringify(
      {
        database: databaseName,
        fixture: counts[0],
        fixtureLoadSeconds: Number(fixtureSeconds.toFixed(2)),
        runs: RUNS,
        milliseconds: {
          minimum: Number(Math.min(...durations).toFixed(2)),
          median: Number(percentile(durations, 0.5).toFixed(2)),
          p95: Number(percentile(durations, 0.95).toFixed(2)),
          maximum: Number(Math.max(...durations).toFixed(2)),
        },
        explain: {
          planningTimeMs: explain['Planning Time'],
          executionTimeMs: explain['Execution Time'],
          topNode: plan['Node Type'],
          indexes: [...indexes].sort(),
          sharedHitBlocks: plan['Shared Hit Blocks'],
          sharedReadBlocks: plan['Shared Read Blocks'],
        },
      },
      null,
      2,
    )}\n`,
  );
}

main()
  .catch((error: unknown) => {
    process.stderr.write(
      `${error instanceof Error ? error.stack : String(error)}\n`,
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    if (dataSource.isInitialized) await dataSource.destroy();
  });
